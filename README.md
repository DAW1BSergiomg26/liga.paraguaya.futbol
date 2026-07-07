# Liga Paraguaya de Futbol

Plataforma web para el seguimiento de la Primera Division paraguaya de futbol. Proyecto de portfolio que permite consultar la tabla de posiciones, informacion de clubes y resultados de partidos en tiempo real.

## Tech Stack

| Capa | Tecnologias |
|------|-------------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, TanStack Query |
| Backend | FastAPI, Python 3.12+, SQLAlchemy (async), Pydantic v2 |
| Base de datos | SQLite (desarrollo) |
| Infraestructura | Docker, Uvicorn |

## Funcionalidades

- Tabla de posiciones actualizada con puntos, partidos jugados, GAF, GC, y racha
- Listado detallado de clubes con estadisticas
- Calendario y resultados de partidos
- API REST documentada automaticamente via OpenAPI

## Capturas

> (Agregar capturas de pantalla aqui)

## Como empezar

### Requisitos

- Python 3.12+
- Node.js 20+
- Docker (opcional)

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
python -m pytest backend/tests/ -v
```

## Estructura del proyecto

```
liga.paraguaya.futbol/
├── backend/
│   ├── app/
│   │   ├── api/          # Routers de FastAPI
│   │   ├── core/         # Configuracion, base de datos
│   │   ├── models/       # Modelos SQLAlchemy
│   │   ├── schemas/      # Schemas Pydantic v2
│   │   ├── scripts/      # Scripts utilitarios (seed)
│   │   ├── services/     # Logica de negocio
│   │   └── main.py       # Punto de entrada de la API
│   ├── tests/            # Tests con pytest
│   └── requirements.txt
├── frontend/
│   ├── src/              # Codigo fuente Next.js
│   └── package.json
├── data/                 # Datos externos
├── Dockerfile.backend
├── Dockerfile.frontend
└── docker-compose.yml
```

## Licencia

Distribuido bajo licencia MIT. Consulta el archivo `LICENSE` para mas informacion.
