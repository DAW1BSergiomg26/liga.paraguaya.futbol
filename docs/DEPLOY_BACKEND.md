# Deploy del Backend — Guía Rápida (gratis, sin tarjeta)

El frontend ya está en Vercel (`https://frontend-ten-swart-85.vercel.app`) pero el
`NEXT_PUBLIC_API_URL` apunta a **Railway muerto** (`backend-production-0b7d.up.railway.app`),
que devuelve `Application not found`. Por eso el sitio carga pero los datos no llegan.

Para producción necesitás un backend en la nube. Acá las dos opciones gratis sin tarjeta.

## Opción 1 — Koyeb (recomendada, free sin tarjeta)

1. Crear cuenta en <https://app.koyeb.com> (NO pide tarjeta).
2. **Create App** → elegir "With YAML" y pegar `koyeb.yaml` (está en la raíz del repo),
   o bien "GitHub" y conectar el repo `DAW1BSergiomg26/liga.paraguaya.futbol`.
3. En env vars (secrets): `ADMIN_API_KEY`, `JWT_SECRET` y `DATABASE_URL` se setean en el
   dashboard de Koyeb como **secrets** (NO van hardcodeados en el YAML). `CORS_ORIGINS` ya
   viene por defecto. `FOOTBALL_DATA_API_KEY` es opcional.
   `DATABASE_URL` es OBLIGATORIA para produccion real: creá un proyecto **Neon** gratis en
   <https://neon.tech> (sin tarjeta) y pegá la connection string (formato
   `postgresql://...?sslmode=require`). El codigo la convierte a `postgresql+asyncpg://`.
   NOTA: el helper de columnas faltantes de Alembic usa `PRAGMA` (solo SQLite). En Postgres
   ese fallback no aplica, pero `alembic upgrade head` SI corre en el arranque, asi que las
   migraciones se aplican bien. No bloquea el deploy.
4. El puerto lo toma de `$PORT` (el `Dockerfile.backend` usa `${PORT:-8001}`).
5. Health check en `/health`.
6. Cuando termine, copiá la **Public URL** (tipo `https://liga-backend-xxxx.koyeb.app`).

## Opción 2 — Render (free, usa el `render.yaml` ya existente)

1. Crear cuenta en <https://render.com> (el plan free exige tarjeta SOLO para verificar,
   no cobra).
2. **New** → **Blueprint** → conectar el repo. Lee `render.yaml` automáticamente.
3. Cuando pida `DATABASE_URL`, pegá la connection string de Neon (gratis, sin tarjeta).
4. Esperar el deploy y copiar la URL (`https://liga-backend.onrender.com`).

## Paso final — Conectar Vercel con el backend

En <https://vercel.com> → proyecto `frontend-ten-swart-85` → **Settings** →
**Environment Variables**:

- Clave: `NEXT_PUBLIC_API_URL`
- Valor: la URL del backend (Koyeb o Render), ej `https://liga-backend-xxxx.koyeb.app`
  (con `https://`, sin barra al final).

Guardar y hacer **Redeploy**. El frontend dejará de dar `ERR_CONNECTION_REFUSED` y
cargará los datos reales.

## Verificar que funciona

```bash
curl https://TU-BACKEND.koyeb.app/health
# -> {"status":"ok", ...}  (o el JSON de estado de la API)

curl https://TU-BACKEND.koyeb.app/api/v1/transferencias?per_page=1
# -> 200 con datos
```

Luego abrir `https://frontend-ten-swart-85.vercel.app` y confirmar que no hay errores
de red en la consola del navegador.
