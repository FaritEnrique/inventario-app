# Frontend CSP

## Problema que resuelve esta estrategia

La CSP del frontend ya no debe usar en produccion:

```text
connect-src 'self' https:
```

Ese enfoque deja abierto cualquier origen HTTPS y contradice una fuente de verdad que ya existe en el proyecto:

- `VITE_API_URL`

La politica productiva debe tomar esa variable, extraer solo su `origin` y usarlo como `connect-src` exacto.

Ejemplo:

```text
VITE_API_URL=https://farit-inventario.duckdns.org/api
```

produce:

```text
connect-src 'self' https://farit-inventario.duckdns.org
```

## Fuente de verdad

La fuente de verdad para `connect-src` en produccion es:

- `VITE_API_URL`

La logica compartida vive en:

- `scripts/frontendCsp.mjs`

Esa misma logica se usa para:

- `vite.config.js` en desarrollo y `vite preview`
- `scripts/sync-frontend-csp.mjs` para materializar la configuracion productiva de hosting

## Politica por entorno

### Desarrollo

En desarrollo, la CSP se sirve desde `vite.config.js` y permite:

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `ws:` y `wss:` para HMR
- `script-src 'unsafe-inline'` solo en desarrollo, porque Vite/React Refresh inyecta un preamble inline necesario para HMR

La politica sigue siendo compatible con:

- estilos inline actuales
- imagenes `data:` y `blob:`
- `worker-src 'self' blob:`

### Produccion

En produccion:

- `VITE_API_URL` es obligatoria
- se extrae solo el `origin`
- `connect-src` queda restringido a:

```text
connect-src 'self' <origin-de-VITE_API_URL>
```

No se deja `https:` abierto.

## Flujo operativo

Antes de build productivo, ejecutar:

```bash
npm run csp:sync
```

Ese script:

- lee `VITE_API_URL` desde el entorno actual o `.env.production`
- genera `public/_headers` para Netlify
- genera `vercel.json` con la misma politica

El script ya esta integrado en:

```bash
npm run build
```

## Configuracion por entorno

### Vite

Archivo:

- `vite.config.js`

Usa la logica compartida para:

- CSP de desarrollo
- CSP de `vite preview`

### Netlify

Archivo operativo:

- `public/_headers`

Netlify toma los headers desde el build publicado. `netlify.toml` ya no contiene una CSP estatica contradictoria.

### Vercel

Archivo operativo:

- `vercel.json`

Se genera con `npm run csp:sync` usando la misma fuente de verdad.

Importante:

- si cambias `VITE_API_URL` productiva, vuelve a ejecutar `npm run csp:sync`
- el `vercel.json` del repo debe quedar sincronizado con ese valor

### VM con Nginx

Para Nginx/Apache no hay generacion automatica desde Vite. La regla es:

1. tomar `VITE_API_URL`
2. extraer su `origin`
3. usar ese origin exacto en `connect-src`

Ejemplo con `VITE_API_URL=https://farit-inventario.duckdns.org`:

```nginx
location / {
    try_files $uri /index.html;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://farit-inventario.duckdns.org; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; worker-src 'self' blob:" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
}
```

Usar `always` para cubrir respuestas relevantes aunque no sean 200 simples.

### VM con Apache

```apache
<IfModule mod_headers.c>
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://farit-inventario.duckdns.org; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; worker-src 'self' blob:"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "DENY"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
</IfModule>
```

## Restricciones que se mantienen

- La CSP del frontend no vuelve a `index.html`.
- No se mezcla con la CSP del backend API.
- No se toca auth/sesion.
- No se toca multi-tab.
- No se toca SUNAT ni su modelo async/background.
