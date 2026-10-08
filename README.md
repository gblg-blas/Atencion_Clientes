# Sistema de turnos de atención

Aplicación local para administrar cuatro mesas de atención. La persona operadora usa **Tomar turno** cuando llega alguien. El sistema entrega el turno a la primera mesa libre; cuando todas están ocupadas, lo coloca en fila. Al pulsar **Finalizar atención**, el siguiente turno pasa automáticamente a esa mesa.

## Iniciar en Windows

1. Descomprime la carpeta del proyecto.
2. Haz doble clic en `INICIAR.bat`.
3. La primera apertura instala Python y Angular automáticamente y puede tomar unos minutos. Se abrirá el sistema en `http://localhost:4200`.

Requisitos: Windows, Python 3.10 o superior, Node.js 20.19 o superior y conexión a internet para la instalación inicial. No necesitas abrir Visual Studio.

## Funciones

- Cuatro mesas, asignación automática y fila de espera.
- Actualizaciones en tiempo real mediante eventos del servidor (SSE).
- Botón para tomar turno y botón para finalizar la atención.
- Reinicio de jornada con confirmación.
- Interfaz adaptable a computadora y móvil.

## Datos y ejecución

No usa base de datos. Los datos viven en la memoria del proceso local: se comparten entre pestañas mientras el servidor siga abierto y se borran al cerrar o reiniciar el servidor. Esta versión está pensada para operar en una computadora local.

## GitHub

GitHub puede guardar y compartir el código fuente. GitHub Pages solo publica sitios estáticos y no ejecuta este backend Python; para operar fuera de la computadora local habría que alojar la API en un servicio con ejecución continua. Nunca agregues contraseñas, tokens ni archivos de credenciales al repositorio.

## Estructura

- `backend/`: API FastAPI y estado temporal en memoria.
- `frontend/`: aplicación Angular.
- `INICIAR.bat`: instala requisitos y abre los dos servicios localmente.
