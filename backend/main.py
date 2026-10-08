from __future__ import annotations

import asyncio
import sys
import threading
import webbrowser
from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

TABLE_COUNT = 4
lock = asyncio.Lock()
waiting: deque[dict[str, Any]] = deque()
tables: list[dict[str, Any]] = []
next_number = 1
subscribers: set[asyncio.Queue[None]] = set()


def snapshot() -> dict[str, Any]:
    return {
        "tables": tables,
        "waiting": list(waiting),
        "next_number": next_number,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


async def broadcast() -> None:
    for queue in tuple(subscribers):
        try:
            queue.put_nowait(None)
        except asyncio.QueueFull:
            pass


def assign_waiting() -> None:
    for table in tables:
        if table["ticket"] is None and waiting:
            table["ticket"] = waiting.popleft()
            table["started_at"] = datetime.now(timezone.utc).isoformat()


@asynccontextmanager
async def lifespan(_: FastAPI):
    global tables
    tables = [{"id": i, "ticket": None, "started_at": None} for i in range(1, TABLE_COUNT + 1)]
    yield


app = FastAPI(title="Turnos de atención", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


@app.get("/api/state")
async def get_state():
    return snapshot()


@app.post("/api/tickets")
async def take_ticket():
    global next_number
    async with lock:
        ticket = {"number": next_number, "created_at": datetime.now(timezone.utc).isoformat()}
        next_number += 1
        waiting.append(ticket)
        assign_waiting()
        result = snapshot()
    await broadcast()
    return result


@app.post("/api/tables/{table_id}/complete")
async def complete_service(table_id: int):
    async with lock:
        table = next((t for t in tables if t["id"] == table_id), None)
        if table is None:
            raise HTTPException(status_code=404, detail="Mesa no encontrada")
        if table["ticket"] is None:
            raise HTTPException(status_code=409, detail="La mesa ya está libre")
        table["ticket"] = None
        table["started_at"] = None
        assign_waiting()
        result = snapshot()
    await broadcast()
    return result


@app.delete("/api/state")
async def reset_state():
    global next_number
    async with lock:
        waiting.clear()
        for table in tables:
            table["ticket"] = None
            table["started_at"] = None
        next_number = 1
        result = snapshot()
    await broadcast()
    return result


@app.get("/api/events")
async def events():
    queue: asyncio.Queue[None] = asyncio.Queue(maxsize=1)
    subscribers.add(queue)

    async def stream():
        try:
            yield f"data: {__import__('json').dumps(snapshot())}\n\n"
            while True:
                try:
                    await asyncio.wait_for(queue.get(), timeout=20)
                    yield f"data: {__import__('json').dumps(snapshot())}\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            subscribers.discard(queue)

    return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


bundle_root = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
web_root = bundle_root / "web"
if web_root.is_dir():
    @app.get("/", include_in_schema=False)
    async def home():
        return FileResponse(web_root / "index.html")

    app.mount("/", StaticFiles(directory=web_root), name="web")


if __name__ == "__main__":
    import uvicorn

    port = 8001
    threading.Timer(1.2, lambda: webbrowser.open(f"http://127.0.0.1:{port}")).start()
    print(f"Sistema de turnos activo en http://127.0.0.1:{port}")
    print("Deja esta ventana abierta mientras uses el sistema. Ciérrala para apagarlo.")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")
