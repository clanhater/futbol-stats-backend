// middlewares/authMiddleware.js
function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  // 1. Comprobar que la variable de entorno está configurada en el servidor
  if (!process.env.ADMIN_API_KEY) {
    // Este es un error de configuración del servidor, no del cliente
    console.error("ADMIN_API_KEY no está configurada en el entorno.");
    return res.status(500).json({ message: 'Error de configuración del servidor.' });
  }

  // 2. Comprobar si la clave fue enviada y si es correcta
  if (!apiKey) {
    return res.status(401).json({ message: 'Acceso no autorizado. Falta la cabecera x-api-key.' });
  }

  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ message: 'Acceso denegado. La clave API es incorrecta.' }); // 403 Forbidden es más apropiado
  }

  next();
}

module.exports = authMiddleware;