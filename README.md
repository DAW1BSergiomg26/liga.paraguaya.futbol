# Liga Paraguaya de Futbol

Plataforma web para el seguimiento de la Primera Division paraguaya de futbol. Proyecto de portfolio que incluye predicciones en vivo, chat por partido, notificaciones push, tabla de posiciones, informacion de clubes, resultados de partidos en tiempo real y datos historicos desde 2020.

## Tech Stack

| Capa | Tecnologias |
|------|-------------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, TanStack Query |
| Backend | FastAPI, Python 3.12+, SQLAlchemy (async), Pydantic v2, WebSockets |
| Base de datos | SQLite (desarrollo) / PostgreSQL (produccion via Alembic) |
| Scraping | selectolax (HTML parser), httpx, RSSSF + Wikipedia |
| Infraestructura | Docker, Uvicorn, Railway (backend), Vercel (frontend) |

## Funcionalidades

### Fase 1 — Predicciones + Autenticacion
- Predicciones en vivo: pronostica resultados (local/empate/visitante) antes del inicio
- Sistema de puntuacion: 3 puntos por resultado exacto, 1 por tendencia
- Leaderboard con ranking de usuarios por aciertos acumulados
- Autenticacion via Google OAuth
- Panel de administracion para gestionar resultados de partidos
- Cron de cierre automatico de predicciones al iniciar cada partido

### Fase 2 — Chat + Notificaciones
- Chat en vivo por partido via WebSocket
- Componentes ChatWidget y ChatMessage en el frontend
- Notificaciones push con Service Worker y Push API
- Suscripcion y envio de notificaciones desde el admin

### Scraper Engine
- Scraper de Wikipedia: datos de los 10 clubes historicos (fundacion, estadio, titulos, escudo)
- Scraper de RSSSF: resultados historicos 2020-2026
- Sistema de cache HTTP, rate limiting y manejo de errores
- Tests para ambos scrapers

### Datos Historicos
- 7 temporadas completas (2020-2026) con resultados de cada jornada
- Tabla de posiciones historica reconstruible desde los datos
- Seed automatico de datos historicos al iniciar la app

### API REST
- Documentacion interactiva via OpenAPI en `/docs`
- Endpoints: clubes, partidos, tabla de posiciones, predicciones, chat, push
- Migraciones automaticas con Alembic al arrancar

## Capturas

> (Agregar capturas de pantalla aqui)

## Como empezar

### Requisitos

- Python 3.12+
- Node.js 20+
- Docker (opcional)

### Variables de entorno

```bash
# Backend
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SECRET_KEY=your_fastapi_secret_key
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### Backend

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r backend/requirements.txt
python -m backend.app.scripts.seed
uvicorn backend.app.main:app --reload --port 8001
```

La API estara disponible en `http://localhost:8001` con documentacion interactiva en `http://localhost:8001/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicacion estara disponible en `http://localhost:3000`.

### Docker

```bash
docker compose up --build
```

## Tests

```bash
# Todos los tests
python -m pytest backend/tests/ -v

# Tests por area
python -m pytest backend/tests/test_chat_push.py -v
python -m pytest backend/tests/test_scraper_base.py -v
python -m pytest backend/tests/test_scraper_clubes.py -v
python -m pytest backend/tests/test_scraper_historico.py -v
python -m pytest backend/tests/test_seed_historico.py -v
```

## Estructura del proyecto

```
liga.paraguaya.futbol/
├── backend/
│   ├── alembic/              # Migraciones de base de datos
│   │   └── versions/         # Revisiones de migracion
│   ├── app/
│   │   ├── api/              # Routers de FastAPI
│   │   ├── core/             # Configuracion, base de datos
│   │   ├── models/           # Modelos SQLAlchemy
│   │   ├── schemas/          # Schemas Pydantic v2
│   │   ├── scripts/          # Scripts utilitarios (seed)
│   │   ├── services/         # Logica de negocio
│   │   └── main.py           # Punto de entrada de la API
│   ├── scripts/              # Scrapers (Wikipedia, RSSSF)
│   ├── tests/                # Tests con pytest
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── sw.js             # Service Worker (push + PWA)
│   └── src/                  # Codigo fuente Next.js
│       ├── app/              # App Router pages
│       └── components/       # Componentes React
├── data/
│   ├── clubes_paraguay.json  # Datos de clubes
│   ├── tabla_posiciones_demo.json
│   └── partidos_historicos/  # Temporadas 2020-2026
├── docs/
│   └── superpowers/          # Documentacion de diseno
├── Dockerfile.backend
├── Dockerfile.frontend
└── docker-compose.yml
```

## Licencia

Distribuido bajo licencia MIT. Consulta el archivo `LICENSE` para mas informacion.
