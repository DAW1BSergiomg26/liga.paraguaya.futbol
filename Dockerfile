FROM python:3.12-slim

WORKDIR /app

# Copiamos todo el repositorio a /app
COPY . .

# Instalamos las dependencias apuntando al requirements.txt dentro de backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

EXPOSE 10000

# Arrancamos Uvicorn indicando la ruta completa del módulo desde la raíz
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "10000"]
