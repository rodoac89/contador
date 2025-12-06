# Etapa 1: Build de Angular
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Build de producción de Angular
RUN npm run build

# Etapa 2: Producción
FROM node:20-alpine

WORKDIR /app

# Copiar solo las dependencias de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar el servidor y la base de datos
COPY server/ ./server/

# Copiar los archivos compilados de Angular desde la etapa de build
COPY --from=build /app/dist/contador/browser ./dist/contador/browser

# Crear directorio para la base de datos
RUN mkdir -p /app/data

# Exponer puertos
EXPOSE 3000

# Variable de entorno para la base de datos
ENV DB_PATH=/app/data/pubg-contador.db

# Comando para iniciar el servidor
CMD ["node", "server/server.js"]
