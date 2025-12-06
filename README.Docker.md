# PUBG Contador de Puntos - Docker

Aplicación para registrar y contabilizar puntos de partidas de PUBG con persistencia en SQLite.

## Reglas de Puntuación

- 1 kill = 1 punto
- 2do lugar = 1 punto  
- Ganador = 3 puntos

## Despliegue en Producción con Docker

### Opción 1: Docker Compose (Recomendado)

1. **Construir y ejecutar el contenedor:**
```bash
docker-compose up -d
```

2. **Ver logs:**
```bash
docker-compose logs -f
```

3. **Detener el contenedor:**
```bash
docker-compose down
```

4. **Reconstruir después de cambios:**
```bash
docker-compose up -d --build
```

### Opción 2: Docker directamente

1. **Construir la imagen:**
```bash
docker build -t pubg-contador .
```

2. **Ejecutar el contenedor:**
```bash
docker run -d \
  -p 3000:3000 \
  -v pubg-data:/app/data \
  --name pubg-contador \
  --restart unless-stopped \
  pubg-contador
```

3. **Ver logs:**
```bash
docker logs -f pubg-contador
```

4. **Detener y eliminar el contenedor:**
```bash
docker stop pubg-contador
docker rm pubg-contador
```

5. **Eliminar la imagen:**
```bash
docker rmi pubg-contador
```

## Acceso a la Aplicación

Una vez que el contenedor esté corriendo, accede a:
- **URL:** http://localhost:3000
- **API:** http://localhost:3000/api/state

## Persistencia de Datos

Los datos se almacenan en un volumen de Docker llamado `pubg-data`:
- **Ubicación en el contenedor:** `/app/data/pubg-contador.db`
- **Ventaja:** Los datos persisten incluso si el contenedor se elimina

### Backup de la Base de Datos

**Crear backup:**
```bash
docker cp pubg-contador:/app/data/pubg-contador.db ./backup-$(date +%Y%m%d).db
```

**Restaurar backup:**
```bash
docker cp ./backup.db pubg-contador:/app/data/pubg-contador.db
docker restart pubg-contador
```

### Ver el contenido del volumen

```bash
docker volume inspect pubg-data
```

### Eliminar el volumen (¡Cuidado! Se perderán los datos)

```bash
docker volume rm pubg-data
```

## Configuración Avanzada

### Variables de Entorno

Puedes personalizar la configuración mediante variables de entorno en el `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - DB_PATH=/app/data/pubg-contador.db
```

### Cambiar el puerto

Si el puerto 3000 está ocupado, modifica el mapeo en `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # La aplicación estará en http://localhost:8080
```

## Solución de Problemas

### El contenedor no inicia

Ver los logs para identificar el error:
```bash
docker-compose logs
```

### Reiniciar el contenedor

```bash
docker-compose restart
```

### Limpiar y reconstruir completamente

```bash
docker-compose down
docker-compose up -d --build --force-recreate
```

### Acceder al shell del contenedor

```bash
docker exec -it pubg-contador sh
```

## Desarrollo vs Producción

| Característica | Desarrollo | Producción (Docker) |
|---------------|------------|---------------------|
| Frontend | http://localhost:4200 | Integrado en http://localhost:3000 |
| Backend | http://localhost:3000 | http://localhost:3000 |
| Hot Reload | ✅ | ❌ |
| Base de Datos | `server/pubg-contador.db` | `/app/data/pubg-contador.db` (volumen) |
| Optimización | No | Sí (build production) |

## Comandos Útiles

```bash
# Ver contenedores corriendo
docker ps

# Ver todos los contenedores
docker ps -a

# Ver volúmenes
docker volume ls

# Ver uso de recursos
docker stats pubg-contador

# Actualizar después de cambios en el código
docker-compose up -d --build
```
