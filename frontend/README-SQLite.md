# SQLite Integration for Development

Este proyecto ahora incluye integración con SQLite para el servidor de desarrollo, proporcionando una base de datos local para almacenar datos de jugadores y partidas.

## Características

- **Base de datos SQLite local**: Los datos se almacenan en `dev-database.db`
- **API RESTful**: Servidor Express que maneja las operaciones CRUD
- **Fallback a localStorage**: Si el servidor SQLite no está disponible, la aplicación usar localStorage como respaldo
- **Sincronización automática**: Los datos se mantienen sincronizados entre la aplicación Angular y la base de datos

## Instalación y Configuración

### Dependencias instaladas:
- `better-sqlite3`: Base de datos SQLite para Node.js
- `express`: Servidor web para la API
- `cors`: Middleware para manejar CORS
- `concurrently`: Para ejecutar múltiples comandos

### Scripts disponibles:

```bash
# Desarrollo con SQLite (recomendado)
npm run start:dev

# Solo servidor Angular (sin SQLite)
npm start

# Solo servidor SQLite
npm run sqlite:dev

# Solo servidor Angular
npm run ng:serve
```

## Uso

### Modo de desarrollo completo:
```bash
npm run start:dev
```
Esto iniciará:
- Servidor SQLite en `http://localhost:3001`
- Aplicación Angular en `http://localhost:4200`

### Endpoints de la API SQLite:

#### Jugadores:
- `GET /api/players` - Obtener todos los jugadores
- `POST /api/players` - Crear un nuevo jugador
- `PUT /api/players/:id` - Actualizar un jugador
- `DELETE /api/players/:id` - Eliminar un jugador

#### Partidas:
- `GET /api/matches` - Obtener todas las partidas
- `POST /api/matches` - Crear una nueva partida
- `DELETE /api/matches/:id` - Eliminar una partida

#### Salud:
- `GET /api/health` - Verificar el estado del servidor

## Estructura de la Base de Datos

### Tabla `players`:
```sql
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  totalPoints INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla `matches`:
```sql
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla `match_scores`:
```sql
CREATE TABLE match_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  kills INTEGER DEFAULT 0,
  placement TEXT DEFAULT 'none',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
  UNIQUE(match_id, player_id)
);
```

## Sistema de Puntuación

Los puntos se calculan automáticamente en el servidor:
- **1 punto por kill**
- **10 puntos adicionales por ganar (primer lugar)**
- **5 puntos adicionales por segundo lugar**

## Manejo de Errores

La aplicación incluye un sistema robusto de manejo de errores:

1. **Conexión fallida**: Si el servidor SQLite no está disponible, la aplicación usa localStorage
2. **Sincronización**: Los datos locales se pueden migrar a SQLite cuando esté disponible
3. **Estados de carga**: La interfaz muestra indicadores de carga durante las operaciones

## Archivos Modificados/Agregados

### Nuevos archivos:
- `dev-server.js` - Servidor SQLite Express
- `src/app/services/sqlite.service.ts` - Servicio para comunicación con SQLite
- `dev-database.db` - Archivo de base de datos SQLite (se crea automáticamente)

### Archivos modificados:
- `src/app/services/game.service.ts` - Actualizado para usar SQLite
- `src/app/app.config.ts` - Agregado HttpClient
- `package.json` - Nuevos scripts y dependencias

## Notas Importantes

1. **Desarrollo**: Use `npm run start:dev` para la mejor experiencia de desarrollo
2. **Base de datos**: El archivo `dev-database.db` se crea automáticamente la primera vez
3. **Puertos**: SQLite usa el puerto 3001, Angular usa el puerto 4200
4. **Persistencia**: Los datos persisten entre reinicios del servidor

## Troubleshooting

### El servidor SQLite no inicia:
1. Verificar que todas las dependencias estén instaladas: `npm install`
2. Comprobar que el puerto 3001 esté libre
3. Revisar los logs en la consola

### Error de conexión de base de datos:
1. La aplicación automáticamente usará localStorage como respaldo
2. Reiniciar el servidor SQLite: `npm run sqlite:dev`
3. Verificar el estado con: `GET http://localhost:3001/api/health`

### Migración de datos existentes:
Si tienes datos en localStorage, estos serán utilizados como respaldo automáticamente si SQLite no está disponible.