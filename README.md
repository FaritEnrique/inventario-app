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

Las variables `.env*` no deben versionarse.

Para desarrollo local puedes usar tu propio archivo `.env` o `.env.local` fuera de Git, por ejemplo:

```env
VITE_API_URL=http://localhost:3000
```

Para produccion y Netlify:

- configurar `VITE_API_URL` en las variables del sitio en Netlify
- apuntar al backend publico, sin necesidad de agregar `/api` manualmente

Ejemplo:

```env
VITE_API_URL=https://tu-backend.example.com
```

## Despliegue en Netlify

El frontend esta pensado para desplegarse como SPA con build nativo de Vite.

Netlify debe construirlo directamente desde GitHub usando:

- comando de build: `npm run build`
- directorio de publicacion: `dist`

La configuracion queda centralizada en:

- `netlify.toml`

`BrowserRouter` requiere fallback de rutas a `index.html`, y eso ya queda cubierto desde `netlify.toml`.

Esto es importante para rutas como:

- `/reset-password`
- `/dashboard`
- `/ordenes-compra/:id`
- cualquier otra ruta directa abierta desde navegador o desde un enlace de correo

## Recomendaciones de trabajo

- reutilizar hooks y APIs existentes antes de crear nuevas capas
- validar `npm run build` despues de tocar rutas, layout o bundling
- mantener sobria la navegacion principal; no saturar el header con acciones secundarias
- no usar Docker para desplegar este frontend en Netlify; el flujo nativo GitHub -> Netlify es suficiente y mas simple
