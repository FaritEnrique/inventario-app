# Inventario App

Frontend del sistema de inventario, abastecimiento, logística y compras. Está construido con React, Vite, React Router y Tailwind CSS para ofrecer una experiencia de negocio moderna y ágil.

## Qué incluye

- Panel principal y navegación por módulos.
- Gestión de requerimientos y procesos logísticos.
- Vistas de cotizaciones, comparativos y buena pro.
- Módulos de órdenes de compra, inventario y reservas.
- Recuperación y cambio de contraseña para usuarios.

## Stack principal

- React 18
- React Router
- Vite
- Tailwind CSS
- React Query
- React Toastify
- Lucide React y React Icons

## Requisitos

- Node.js 20 o superior
- npm

## Inicio rápido

1. Entra a la carpeta del frontend.
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` si necesitas apuntar al backend local:
   ```env
   VITE_API_URL=http://localhost:3000
   ```
4. Inicia la aplicación en desarrollo:
   ```bash
   npm run dev
   ```

## Scripts útiles

- `npm run dev`: inicia la app en desarrollo.
- `npm run build`: sincroniza CSP y genera el build de producción.
- `npm run preview`: sirve localmente el build generado.
- `npm run lint`: ejecuta ESLint.
- `npm run test`: ejecuta pruebas con Vitest.

## Estructura del proyecto

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

La aplicación usa React Router con rutas protegidas y carga diferida para las páginas más pesadas. El layout global vive en los componentes de encabezado y estructura base de la aplicación.

## Estado funcional actual

### Requerimientos

- Módulo visible y conectado.
- Listado, creación, detalle y edición operativos.
- Bandejas de aprobación activas.

### Logística y cotizaciones

- Bandejas operativas para jefatura y operador.
- Sub-layout para resumen, solicitudes, cotizaciones y comparativos.
- Flujo de buena pro por ítem desde el comparativo.
- Preparado para la siguiente tanda de integración con órdenes de compra.

### Inventario y abastecimiento

- Órdenes de compra, notas de ingreso y salida, reservas, recepciones, stock y movimientos.

## Despliegue en Netlify

El frontend está pensado para desplegarse como SPA con Vite.

Configuración recomendada:

- Build: `npm run build`
- Directorio de publicación: `dist`

La configuración queda centralizada en [netlify.toml](netlify.toml), incluyendo el fallback necesario para rutas directas.

## Notas de desarrollo

- Reutiliza hooks y servicios existentes antes de crear nuevas capas.
- Valida `npm run build` después de tocar rutas, layouts o imports dinámicos.
- Mantén el header global sobrio y evita dejar placeholders de UI sin tratamiento responsive.
