# Deploy del Backend — Guía Definitiva (Koyeb + Neon, gratis sin tarjeta)

## Estado
- Frontend: Vercel OK (Framework Preset = Next.js, Root Directory = frontend).
- Backend: NO existe en la nube. Se despliega con esta guía.
- Objetivo: backend en Koyeb apuntando a Neon Postgres, y Vercel leyéndolo vía
  `NEXT_PUBLIC_API_URL`.

## Paso 1 — Crear Neon Postgres (gratis, sin tarjeta)
1. Ir a <https://neon.tech> → Sign up con GitHub.
2. **Create project** → elegir región (ej. AWS US East / Frankfurt).
3. En la pantalla de **Connection Details**, copiar la **connection string** que
   empieza con `postgresql://<user>:<pass>@<host>/<db>?sslmode=require`.
   Esta es tu `DATABASE_URL`. Guárdala (la vas a pegar en Koyeb).

## Paso 2 — Crear el App en Koyeb
1. Ir a <https://app.koyeb.com> (ya logueado).
2. Click en **Create App** (arriba a la derecha).
3. Elegir **"With YAML"** y pegar el contenido de `koyeb.yaml` (raíz del repo),
   O elegir **GitHub** y conectar `DAW1BSergiomg26/liga.paraguaya.futbol`.
   - Builder: Dockerfile (`Dockerfile.backend`), root = raíz del repo.
   - Health check: `/health`.
   - Puerto: lo toma de `$PORT` (Dockerfile usa `${PORT:-8001}`).
4. En **Environment variables / Secrets**, agregar COMO SECRET estas 3:
   - `DATABASE_URL` = la string de Neon del Paso 1 (con `?sslmode=require`).
   - `ADMIN_API_KEY` = una clave que inventes (ej. `Rufi141414` o algo más seguro).
   - `JWT_SECRET` = una cadena larga y aleatoria (ej. 32+ chars al azar).
   - `CORS_ORIGINS` ya viene por defecto en el YAML apuntando a
     `https://liga.paraguaya.futbol` — dejarla (o ajustar a tu dominio real).
   - `FOOTBALL_DATA_API_KEY` es opcional (si vacía, el sync externo queda off).
5. **Deploy**. El primer build tarda ~2-3 min (instala dependencias del Dockerfile).
6. Cuando el App esté en verde, copiar la **Public URL** (tipo
   `https://liga-backend-xxxx.koyeb.app`).

## Paso 3 — Conectar Vercel con el backend
1. <https://vercel.com> → proyecto `liga.paraguaya.futbol` → **Settings** →
   **Environment Variables**.
2. Clave: `NEXT_PUBLIC_API_URL`
   Valor: la URL de Koyeb del Paso 2 (ej. `https://liga-backend-xxxx.koyeb.app`),
   con `https://` y SIN barra al final.
3. **Save** → ir a **Deployments** → **Redeploy**.
4. El frontend dejará de dar `ERR_CONNECTION_REFUSED` y cargará datos reales.

## Paso 4 — Verificar que funciona
```bash
curl https://TU-BACKEND.koyeb.app/health
# -> {"status":"ok","mensaje":"Backend activo correctamente"}

curl https://TU-BACKEND.koyeb.app/api/v1/transferencias?per_page=1
# -> 200 con datos

curl https://TU-BACKEND.koyeb.app/api/v1/clubes
# -> 200 con datos
```
Luego abrir `https://liga.paraguaya.futbol` y confirmar en la consola del
navegador que no hay errores de red.

## Notas técnicas
- **Migraciones Alembic**: corren solas en el arranque (lifespan de `main.py`
  llama `run_alembic_upgrade()`, que lee `settings.database_url`). Con
  `DATABASE_URL` de Neon, se aplican automáticamente.
- **Bug conocido (no bloquea)**: el helper de columnas faltantes de Alembic usa
  `PRAGMA table_info(...)`, que es solo de SQLite. En Postgres ese fallback no
  aplica, pero `alembic upgrade head` sí corre, así que el esquema se crea bien.
- **JWT**: si no seteás `JWT_SECRET`, el backend genera uno efímero por arranque
  (los tokens previos dejan de servir al reiniciar). Para producción, setealo.
- **Cero secretos en el repo**: `koyeb.yaml` y `config.py` NO contienen secretos
  reales; todo va por variables de entorno / secrets del dashboard.
