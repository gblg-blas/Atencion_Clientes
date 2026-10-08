# Sistema de turnos de atencion

Aplicacion local para administrar cuatro mesas. Usa el boton Tomar turno para registrar al siguiente cliente. El sistema lo asigna a la primera mesa libre o lo deja en fila hasta que una mesa se desocupe. Al finalizar una atencion, el siguiente turno pasa automaticamente a esa mesa.

## Iniciar en Windows

1. Descomprime el proyecto.
2. Haz doble clic en INICIAR.bat.
3. La primera apertura instala los requisitos y abre http://localhost:4200.

Requiere Windows, Python 3.10 o superior, Node.js 20.19 o superior e internet para la instalacion inicial.

## Componentes

- backend: API Python con FastAPI.
- frontend: interfaz Angular.
- Sin base de datos: los turnos viven en memoria y se borran al cerrar el servidor.
- Actualizaciones en tiempo real mientras el servidor local esta abierto.

GitHub almacena el codigo. Para usarlo fuera de esta computadora se requiere alojar la API Python en un servidor. No subas credenciales ni tokens al repositorio.
