import { Component, NgZone, OnDestroy, OnInit, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Ticket { number: number; created_at: string; }
interface Table { id: number; ticket: Ticket | null; started_at: string | null; }
interface State { tables: Table[]; waiting: Ticket[]; next_number: number; updated_at: string; }
const API_BASE = window.location.port === '4200' ? 'http://127.0.0.1:8000/api' : '/api';

@Component({
  selector: 'app-root', standalone: true,
  template: `
  <main class="shell">
    <header class="topbar"><a class="brand" href="#"><span class="brand-mark">T</span><span>Turnos<span class="brand-light"> / Atención</span></span></a><div class="live"><i></i> EN VIVO</div></header>
    <section class="intro"><div><div class="eyebrow">CENTRO DE ATENCIÓN</div><h1>Control de turnos</h1><p>Asigna cada cliente a la primera mesa disponible.</p></div><button class="reset" (click)="reset()" [disabled]="busy()">↻ <span>Reiniciar jornada</span></button></section>
    @if (error()) { <div class="error">{{error()}}</div> }
    <section class="metrics"><article class="metric"><span class="metric-label">MESAS OCUPADAS</span><strong>{{occupied()}}<small> / 4</small></strong><div class="meter"><span [style.width.%]="occupied()*25"></span></div></article><article class="metric"><span class="metric-label">EN ESPERA</span><strong>{{state()?.waiting?.length ?? 0}}</strong><div class="metric-note">Clientes en fila</div></article><article class="metric"><span class="metric-label">SIGUIENTE TURNO</span><strong class="next">{{nextNumber()}}</strong><div class="metric-note">Se asigna al tomar turno</div></article><button class="take-card" (click)="takeTicket()" [disabled]="busy()"><span class="take-icon">＋</span><span class="take-copy"><b>Tomar turno</b><small>Registrar al siguiente cliente</small></span><span class="arrow">→</span></button></section>
    <section class="section-head"><div><div class="eyebrow">OPERACIÓN</div><h2>Mesas de atención</h2></div><span class="section-count">4 ESTACIONES</span></section>
    <section class="tables">@for (table of state()?.tables ?? []; track table.id) { <article class="table-card" [class.busy-table]="!!table.ticket"><div class="table-top"><span class="table-name">MESA {{table.id}}</span><span class="status" [class.status-busy]="!!table.ticket"><i></i>{{table.ticket ? 'ATENDIENDO' : 'DISPONIBLE'}}</span></div><div class="ticket-number">{{table.ticket ? ('#' + table.ticket.number) : '—'}}</div><div class="table-bottom">@if (table.ticket) {<span>En servicio</span><button class="finish" (click)="complete(table.id)" [disabled]="busy()">Finalizar atención</button>} @else {<span>Esperando cliente</span><span class="clock">○ Libre</span>}</div></article> }</section>
    <section class="section-head queue-head"><div><div class="eyebrow">SIGUIENTES CLIENTES</div><h2>Fila de espera <span class="queue-total">{{state()?.waiting?.length ?? 0}}</span></h2></div><span class="section-count">{{state()?.waiting?.length ? 'ASIGNACIÓN AUTOMÁTICA' : 'SIN PENDIENTES'}}</span></section>
    @if ((state()?.waiting?.length ?? 0) > 0) { <section class="queue">@for (ticket of state()?.waiting ?? []; track ticket.number; let i = $index) { <div class="queue-row"><span class="queue-position">{{i + 1}}</span><span class="queue-ticket">Turno <b>#{{ticket.number}}</b></span><span class="queue-time">En espera</span><span class="queue-state">SIGUIENTE DISPONIBLE</span></div> }</section> } @else { <section class="empty"><span class="empty-check">✓</span><span><b>La fila está vacía</b><small>Los nuevos turnos aparecerán aquí.</small></span></section> }
    <footer><span>ATENCIÓN AL CLIENTE</span><span>Los cambios se actualizan en tiempo real</span></footer>
  </main>`
})
class AppComponent implements OnInit, OnDestroy {
  state = signal<State | null>(null); busy = signal(false); error = signal('');
  private events?: EventSource;
  constructor(private http: HttpClient, private zone: NgZone) {}
  ngOnInit() { this.refresh(); this.events = new EventSource(`${API_BASE}/events`); this.events.onmessage = e => this.zone.run(() => this.state.set(JSON.parse(e.data) as State)); }
  ngOnDestroy() { this.events?.close(); }
  occupied() { return this.state()?.tables.filter(t => !!t.ticket).length ?? 0; }
  nextNumber() { return this.state()?.next_number ?? '—'; }
  refresh() { this.http.get<State>(`${API_BASE}/state`).subscribe({next: s => this.state.set(s), error: () => this.error.set('No se pudo conectar con el servidor. Cierra y abre la aplicación de nuevo.')}); }
  takeTicket() { this.action(this.http.post<State>(`${API_BASE}/tickets`, {})); }
  complete(id: number) { this.action(this.http.post<State>(`${API_BASE}/tables/${id}/complete`, {})); }
  reset() { if (confirm('¿Reiniciar la jornada? Se borrarán los turnos y se liberarán todas las mesas.')) this.action(this.http.delete<State>(`${API_BASE}/state`)); }
  private action(request: Observable<State>) { this.busy.set(true); this.error.set(''); request.subscribe({next: s => { this.state.set(s); this.busy.set(false); }, error: (e: HttpErrorResponse) => { this.error.set(e.error?.detail ?? 'No se pudo completar la acción.'); this.busy.set(false); }}); }
}
bootstrapApplication(AppComponent, {providers: [provideHttpClient()]}).catch(console.error);
