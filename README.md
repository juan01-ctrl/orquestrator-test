# Orchestrix

Base de un proyecto Astro lista para empezar a desarrollar.

## Requisitos

- Node.js 20.3.0 o superior
- npm

## Desarrollo

```sh
npm install
npm run dev
```

Astro inicia el servidor local y muestra la URL en la terminal.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo. |
| `npm run build` | Genera el sitio estático en `dist/`. |
| `npm run preview` | Previsualiza la versión compilada. |
| `npm run check` | Revisa TypeScript y errores de Astro. |
| `npm test` | Ejecuta las pruebas de actividad de tareas con Node.js, sin dependencias adicionales. |

Las páginas se agregan en `src/pages/`. Los componentes reutilizables pueden vivir en `src/components/` y los assets públicos en `public/`.

## Actividad de tareas

El panel está en `/tasks`, con enlaces desde las páginas de registro e inicio de
sesión. Usa **36 tareas de ejemplo locales**, sin API, backend ni servicios
externos. El fixture está en `src/features/tasks/fixture.json` y se carga de forma
asíncrona para mostrar los estados de carga y error con reintento.

La búsqueda se aplica con Enter o el botón Search. Los cambios de estado y orden
se aplican al seleccionarlos. La URL guarda `q`, `status`, `sort` y `page`; permite
recargar, compartir el enlace y usar Atrás/Adelante. Cambiar la búsqueda, el estado
o el orden vuelve a la primera página. Cada página contiene hasta diez tareas.

Las pruebas cubren filtros combinados, orden, límites de paginación, restauración
del estado desde la URL, datos inválidos y reintentos de carga. Para revisión en
el navegador después de instalar las dependencias:

- Abrir `/tasks` en escritorio y a 320 px de ancho; revisar títulos largos.
- Buscar, cambiar el estado, avanzar de página, recargar y usar Atrás/Adelante.
- Usar Tab y Enter para abrir una tarea; cerrar con Escape y comprobar el foco.
- Abrir una tarea sin responsable ni descripción y revisar los textos alternativos.
- Buscar un título inexistente y limpiar los filtros.
- Bloquear el recurso `fixture` en las herramientas del navegador para comprobar
  el error; desbloquearlo y pulsar Try again. Ralentizar la red para ver la carga.
