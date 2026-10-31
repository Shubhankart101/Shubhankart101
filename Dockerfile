FROM node:22-bookworm-slim AS frontend-build
WORKDIR /build/frontend
COPY portfolio-website/frontend/package*.json ./
RUN npm ci
COPY portfolio-website/frontend/ ./
ARG VITE_BASE_PATH=/static/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
RUN npm run build

FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_DEBUG=false
WORKDIR /app
COPY portfolio-website/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY portfolio-website/backend/ /app/portfolio-website/backend/
COPY --from=frontend-build /build/frontend/dist/ /app/portfolio-website/frontend/dist/
COPY RESUME.pdf /app/RESUME.pdf
WORKDIR /app/portfolio-website/backend
RUN DJANGO_SECRET_KEY=build-only-static-collection-key python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 1 --threads 2 --timeout 120"]
