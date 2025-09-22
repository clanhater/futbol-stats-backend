// middlewares/authMiddleware.js
function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ message: 'No autorizado.' });
  }
  next();
}

module.exports = authMiddleware;