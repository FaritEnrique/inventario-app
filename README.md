# Inventario App

Frontend del sistema de inventario, abastecimiento y compras construido con React, Vite y Tailwind CSS.

## Stack

- React
- React Router
- Vite
- Tailwind CSS
- React Toastify

## Scripts

- `npm run dev`: inicia la app en desarrollo
- `npm run build`: genera el build de produccion
- `npm run preview`: sirve el build localmente
- `npm run lint`: ejecuta ESLint

## Estado funcional actual

### Requerimientos

Estado actual:

- modulo visible y conectado
- listado operativo
- creacion operativa
- edicion operativa
- detalle operativo
- bandejas de aprobacion activas
- impresion simple operativa

Rutas activas:

- `/requerimientos`
- `/requerimientos/nuevo`
- `/requerimientos/:id`
- `/requerimientos/:id/editar`
- `/requerimientos/bandeja/jefatura`
- `/requerimientos/bandeja/gerencia-area`
- `/requerimientos/bandeja/gerencia-administracion`
- `/requerimientos/bandeja/gerencia-general`

Archivos clave:

- `src/App.jsx`
- `src/pages/RequerimientosPage.jsx`
- `src/pages/CrearRequerimientoPage.jsx`
- `src/pages/EditarRequerimientoPage.jsx`
- `src/pages/RequerimientoDetallePage.jsx`
- `src/pages/RequerimientosBandejaPage.jsx`
- `src/hooks/useRequerimientos.js`
- `src/api/requerimientosApi.js`

### Cotizaciones

Estado actual:

- APIs frontend existentes
- hooks existentes
- sin paginas ni rutas activas todavia

Archivos base ya presentes:

- `src/api/solicitudesCotizacionApi.js`
- `src/api/cotizacionesApi.js`
- `src/hooks/useSolicitudesCotizacion.js`
- `src/hooks/useCotizaciones.js`

Lectura recomendada del estado actual:

- la capa tecnica existe
- el modulo visual todavia no esta cerrado
- antes de agregar pantallas conviene alinear semantica y contratos backend

## Estructura relevante

```text
inventario-app/
  src/
    api/
    components/
    context/
    hooks/
    pages/
    utils/
```

## Navegacion y permisos

- `Requerimientos` ya usa guardas de ruta para bandejas
- la autoridad real sigue siendo el backend
- los helpers de permisos de UI deben mantenerse alineados con los permisos efectivos del backend

## Objetivo de la siguiente etapa

Para `Cotizaciones`, la siguiente fase razonable no es redisenar la app sino:

1. cerrar semantica backend
2. cerrar contratos y permisos
3. exponer frontend operativo minimo
4. agregar comparacion y adjudicacion

## Recomendaciones de trabajo

- reutilizar hooks y APIs existentes antes de crear nuevas capas
- mantener coherencia entre badges, permisos, rutas y respuestas backend
- validar `npm run build` despues de cualquier cambio de modulo
