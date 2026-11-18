// Error handling middleware for the Batloung Farm Distribution System

// Global error handler
export function errorHandler(err, req, res, next) {
  const status = err.status ?? (err.sqlMessage || err.sql ? 400 : 500);
  let message = err.sqlMessage ?? err.message ?? 'Unexpected server error.';

  // Database connection errors
  if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
    message = 'Cannot reach the database. Check DB_HOST in your .env file — ensure MySQL is running locally.';
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    message = 'The database rejected the login. Check DB_USER and DB_PASSWORD in .env.';
  } else if (err.code === 'ER_NO_SUCH_TABLE') {
    message = 'The tables are missing. Run: npm run db:init';
  } else if (err.code === 'ECONNREFUSED') {
    message = 'The database refused the connection. Check DB_HOST and DB_PORT in .env. Is MySQL running?';
  } else if (err.code === 'ER_BAD_DB_ERROR') {
    message = `Database '${process.env.DB_NAME || 'batloung_farm'}' does not exist. Run: npm run db:init`;
  }

  if (status >= 500) {
    console.error('[API Error]', err);
  }

  res.status(status).json({ error: message });
}

// 404 handler for non-API routes
export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found.' });
}

// Request logging middleware
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
}