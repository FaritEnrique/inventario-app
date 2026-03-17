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

- Modulo visible y conectado
- Listado, creacion, detalle y edicion operativos
- Bandejas de aprobacion activas
- Guidance y empty states ajustados para actor efectivo

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

- Bandeja de jefatura operativa
- Bandeja de operador operativa
- Detalle logístico operativo
- Comparativo embebido operativo
- Adjudicacion conectada al flujo principal

La pagina separada de comparacion ya no forma parte del circuito activo.

### Inventario / Abastecimiento

- Ordenes de compra: listado y detalle documental
- Nota de ingreso: listado y detalle documental
- Nota de salida: listado y detalle documental
- Reservas: listado, detalle, liberar y despachar
- Recepciones, stock, movimientos, kardex y operaciones: operativos

### Cuenta del usuario

- Solicitar restablecimiento
- Restablecer contrasena por token
- Cambiar contrasena autenticado desde dashboard

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

## Navegacion y permisos

- El dashboard es el hub principal actual
- La autoridad real sigue siendo el backend
- Los helpers de permisos en UI no deben abrir permisos nuevos ni duplicar reglas frágiles

## Variables de entorno

En desarrollo local:

```env
VITE_API_URL=http://localhost:3000
```

## Despliegue en Netlify

El frontend esta pensado para desplegarse como SPA.

Se usa `BrowserRouter`, por lo que Netlify necesita fallback de rutas a `index.html`.

Eso ya queda cubierto con:

- `public/_redirects`

Contenido:

```txt
/* /index.html 200
```

Esto es importante para rutas como:

- `/reset-password`
- `/dashboard`
- `/ordenes-compra/:id`
- cualquier otra ruta directa abierta desde navegador o desde un enlace de correo

## Recomendaciones de trabajo

- reutilizar hooks y APIs existentes antes de crear nuevas capas
- validar `npm run build` despues de tocar rutas, layout o bundling
- mantener sobria la navegacion principal; no saturar el header con acciones secundarias
