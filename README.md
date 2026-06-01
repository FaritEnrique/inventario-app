# Inventario App

Frontend del sistema de inventario, abastecimiento, logistica y compras. Esta construido con React, Vite, React Router y Tailwind CSS.

## Stack

- React 18
- React Router
- Vite
- Tailwind CSS
- React Query
- React Toastify
- Lucide React y React Icons

## Scripts

- `npm run dev`: inicia la app en desarrollo.
- `npm run build`: sincroniza CSP y genera el build de produccion.
- `npm run preview`: sirve localmente el build generado.
- `npm run lint`: ejecuta ESLint.
- `npm run test`: ejecuta pruebas con Vitest.

## Variables de entorno

Las variables `.env*` no deben versionarse.

Para desarrollo local:

```env
VITE_API_URL=http://localhost:3000
```

Para produccion y Netlify:

- configurar `VITE_API_URL` en las variables del sitio.
- apuntar al backend publico.
- no agregar `/api` manualmente si el cliente API ya lo compone.

Ejemplo:

```env
VITE_API_URL=https://tu-backend.example.com
```

## Estructura relevante

```text
inventario-app/
  public/
  src/
    api/
    components/
    context/
    hooks/
    pages/
    utils/
```

## Rutas y layout principal

La app usa `BrowserRouter`, rutas protegidas y lazy loading para paginas pesadas.

El layout general vive en:

- `src/components/LayoutInventario.jsx`
- `src/components/Header.jsx`

`LayoutInventario` contiene el header global, el `Outlet` principal y el footer. Las paginas internas deben cuidar su propio ancho, pero el layout base debe mantenerse tolerante a contenido ancho con reglas como `min-w-0` y control de overflow cuando corresponda.

## Proceso logistico

El flujo logistico usa una estructura de sublayout bajo el expediente del
requerimiento. Las nuevas implementaciones deben trabajar sobre estas paginas
hijas y no sobre la pantalla historica de prueba.

Entrada actual:

- `src/pages/ProcesoLogisticoPage.jsx`
- `src/components/LayoutProcesoCotizacion.jsx`
- `src/components/HeaderProcesoLogistico.jsx`

Ruta padre:

```text
/cotizaciones/proceso/:id
```

Rutas hijas previstas:

```text
/cotizaciones/proceso/:id
/cotizaciones/proceso/:id/solicitudes
/cotizaciones/proceso/:id/cotizaciones
/cotizaciones/proceso/:id/comparativos
```

Componentes hijos actuales:

- `src/pages/ResumenProcesoLogisticoPage.jsx`
- `src/pages/SolicitudesProcesoLogisticoPage.jsx`
- `src/pages/CotizacionesProcesoLogisticoPage.jsx`
- `src/pages/ComparativosProcesoLogisticoPage.jsx`

Ruta historica de prueba:

- `src/pages/ProcesoLogisticoDetallePage.jsx`

`ProcesoLogisticoDetallePage.jsx` debe tratarse como referencia historica y no
como objetivo principal para nuevas funcionalidades.

### Responsabilidades del sublayout logistico

`LayoutProcesoCotizacion` debe:

- leer `id` desde la URL.
- cargar el detalle con `useLogisticaCotizaciones`.
- mostrar `Loader` con el texto `Cargando detalle de cotizacion...`.
- mostrar un estado visual de error.
- renderizar el `Outlet` de las paginas hijas.
- pasar contexto compartido a las paginas hijas con `useOutletContext`.

`HeaderProcesoLogistico` debe:

- mostrar informacion minima del expediente.
- mostrar el codigo del requerimiento (`detalleGlobal.codigo`) con fallback a `#id`.
- navegar usando rutas absolutas bajo `/cotizaciones/proceso/:id`.
- usar menu hamburguesa antes de `lg`.
- cerrar el menu al seleccionar una opcion, al volver a pulsar el boton o al hacer click fuera.

### Solicitudes y flujos de cotizacion

El frontend debe respetar la separacion del backend por `FlujoCotizacion`:

- Un requerimiento puede tener un flujo `LOCAL` y uno `IMPORTACION`.
- Las solicitudes nuevas se asocian al flujo segun su `tipoCompra`.
- Si el usuario crea una solicitud de un tipo distinto al flujo ya existente,
  la UI debe advertir que se usara o creara un flujo comparativo independiente.
- Si el flujo elegido esta cerrado, la UI debe bloquear la emision de nuevas
  solicitudes para ese flujo.
- La seleccion parcial de items por solicitud se mantiene.

Puntos principales de creacion:

- `src/pages/SolicitudesProcesoLogisticoPage.jsx`
- `src/pages/CotizacionesBandejaPage.jsx`

Helper relacionado:

- `src/utils/flujoCotizacionUi.js`

### Cotizaciones, comparativo y Buena Pro

- `CotizacionesProcesoLogisticoPage.jsx` gestiona cotizaciones por flujo y
  cierre/reapertura.
- `ComparativosProcesoLogisticoPage.jsx` muestra el comparativo derivado por
  flujo cerrado.
- El comparativo no aprueba ni rechaza la decision. La decision formal se
  registra como Buena Pro.
- La Buena Pro se otorga por item desde celdas `COTIZADO` validas.
- Los items `NO_COTIZA` se muestran, pero no son seleccionables.
- La Buena Pro vigente puede anularse logicamente con motivo y causal.
- La pantalla no genera Orden de Compra todavia.

Utilidades relacionadas:

- `src/utils/comparativoFlujoViewModel.js`
- `src/utils/buenaProPayload.js`

## Estado funcional actual

### Requerimientos

- Modulo visible y conectado.
- Listado, creacion, detalle y edicion operativos.
- Bandejas de aprobacion activas.
- Estados vacios y reglas de actor efectivo ajustadas en UI.

Rutas activas:

- `/requerimientos`
- `/requerimientos/nuevo`
- `/requerimientos/:id`
- `/requerimientos/:id/editar`
- `/requerimientos/bandeja/jefatura`
- `/requerimientos/bandeja/gerencia-area`
- `/requerimientos/bandeja/gerencia-administracion`
- `/requerimientos/bandeja/gerencia-general`

### Logistica / Cotizaciones

- Bandeja de jefatura operativa.
- Bandeja de operador operativa.
- Sublayout logistico operativo para resumen, solicitudes, cotizaciones y
  comparativos.
- Advertencia `LOCAL` / `IMPORTACION` al crear solicitudes cuando corresponde.
- Comparativo derivado por flujo cerrado.
- Buena Pro por item desde comparativo por flujo.
- Preparado para que una tanda posterior conecte Buena Pro con generacion de
  Orden de Compra.

### Inventario / Abastecimiento

- Ordenes de compra: listado y detalle documental.
- Nota de ingreso: listado y detalle documental.
- Nota de salida: listado y detalle documental.
- Reservas: listado, detalle, liberar y despachar.
- Recepciones, stock, movimientos, kardex y operaciones: operativos.

### Cuenta del usuario

- Solicitar restablecimiento.
- Restablecer contrasena por token.
- Cambiar contrasena autenticado desde dashboard.

## Navegacion y permisos

- El dashboard es el hub principal.
- La autoridad real de permisos sigue siendo el backend.
- Los helpers de permisos en UI no deben abrir permisos nuevos ni duplicar reglas fragiles.
- Las rutas protegidas deben envolver paginas completas, no fragmentos internos de negocio.

## Despliegue en Netlify

El frontend esta pensado para desplegarse como SPA con build nativo de Vite.

Netlify debe construirlo directamente desde GitHub usando:

- comando de build: `npm run build`
- directorio de publicacion: `dist`

La configuracion queda centralizada en:

- `netlify.toml`

`BrowserRouter` requiere fallback de rutas a `index.html`, cubierto desde `netlify.toml`.

Esto es importante para rutas directas como:

- `/reset-password`
- `/dashboard`
- `/ordenes-compra/:id`
- `/cotizaciones/proceso/:id`
- `/cotizaciones/proceso/:id/solicitudes`

## Recomendaciones de trabajo

- Reutilizar hooks y APIs existentes antes de crear nuevas capas.
- Validar `npm run build` despues de tocar rutas, lazy imports, layout o bundling.
- Mantener el header global sobrio.
- Evitar que placeholders con `<pre>` o JSON crudo rompan responsive; usar `overflow-x-auto` o retirarlos al migrar UI real.
- No usar Docker para desplegar este frontend en Netlify; el flujo GitHub -> Netlify es suficiente.
