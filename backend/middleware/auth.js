import jwt from 'jsonwebtoken';

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

export function requireUser(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'user') return res.status(403).json({ success: false, message: 'Customer access required.' });
    req.auth = payload;
    next();
  } catch { return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' }); }
}

export function requireAdmin(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Admin login required.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') return res.status(403).json({ success: false, message: 'Administrator access required.' });
    req.auth = payload;
    next();
  } catch { return res.status(401).json({ success: false, message: 'Admin session expired. Please log in again.' }); }
}

export function optionalUser(req, _res, next) {
  try {
    const token = readToken(req);
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.role === 'user') req.auth = payload;
    }
  } catch { /* Guest checkout is allowed; invalid tokens are treated as guest sessions. */ }
  next();
}
