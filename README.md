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

El flujo logistico esta en migracion hacia una estructura de sublayout.

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

Estas paginas hijas aun pueden contener placeholders de migracion. La referencia funcional completa sigue siendo:

- `src/pages/ProcesoLogisticoDetallePage.jsx`

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
- Detalle logistico operativo en la pagina historica.
- Nueva estructura de sublayout logistico en proceso.
- Comparativo y adjudicacion conectados al flujo principal en la implementacion historica.

La pagina `ProcesoLogisticoDetallePage.jsx` debe tratarse como referencia durante la migracion al nuevo sublayout.

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
