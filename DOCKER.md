# Instrucciones para levantar la aplicación con Docker

## Pre-requisitos
- Docker
- Docker Compose

## Configuración inicial

1. Copia el archivo de variables de entorno:
```bash
cp .env.example .env
```

2. Edita el archivo `.env` y cambia los valores por defecto (especialmente las contraseñas y SECRET_KEY en producción).

## Levantar la aplicación

Para iniciar todos los servicios en modo producción:

```bash
docker-compose up -d
```

Este comando:
- Levanta una base de datos PostgreSQL
- Construye y ejecuta el backend Django
- Construye y ejecuta el frontend Angular
- Configura Nginx como reverse proxy

## Acceder a la aplicación

- **Frontend**: http://localhost:80
- **API**: http://localhost:8080/api/
- **Admin Django**: http://localhost:8080/admin/

## Ver logs

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

## Detener la aplicación

```bash
docker-compose down
```

Para detener y eliminar los volúmenes (¡esto borrará la base de datos!):

```bash
docker-compose down -v
```

## Reconstruir las imágenes

Si haces cambios en el código:

```bash
docker-compose up -d --build
```

## Ejecutar comandos en el backend

```bash
# Crear un superusuario de Django
docker-compose exec backend python manage.py createsuperuser

# Ejecutar migraciones
docker-compose exec backend python manage.py migrate

# Acceder al shell de Django
docker-compose exec backend python manage.py shell
```

## Estructura de servicios

- **db**: PostgreSQL 16
- **backend**: Django + Gunicorn (puerto interno 8000)
- **frontend**: Angular + Nginx (puerto interno 80)
- **nginx**: Reverse proxy (puerto 8080) que enruta:
  - `/api/*` → backend
  - `/admin/*` → backend
  - `/*` → frontend

## Notas de producción

Para producción adicional, considera:

1. Usar HTTPS con certificados SSL/TLS
2. Cambiar todas las contraseñas y SECRET_KEY
3. Configurar un dominio real en ALLOWED_HOSTS
4. Revisar los logs y configurar monitoreo
5. Hacer backups regulares de la base de datos
6. Usar volúmenes con nombres específicos para backups
