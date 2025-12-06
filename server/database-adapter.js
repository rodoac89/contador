const sqlite = require('./database');
const postgres = require('./database-postgres');

// Usar SQLite en desarrollo y PostgreSQL en producción
const database = process.env.NODE_ENV === 'production' ? postgres : sqlite;

module.exports = database;