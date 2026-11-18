import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import User from '../models/userModel.js';

const makeToken = (user) => jwt.sign({ id: user._id.toString(), role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });

export async function registerUser(req, res) {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2) return res.status(400).json({ success: false, message: 'Name must contain at least 2 characters.' });
    if (!validator.isEmail(email)) return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    if (await User.exists({ email })) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
    return res.status(201).json({ success: true, token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    console.error('registerUser:', error);
    return res.status(500).json({ success: false, message: 'Could not create your account.' });
  }
}

export async function loginUser(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, message: 'Email or password is incorrect.' });
    return res.json({ success: true, token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('loginUser:', error);
    return res.status(500).json({ success: false, message: 'Could not sign in.' });
  }
}

export async function loginAdmin(req, res) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return res.status(503).json({ success: false, message: 'Configure ADMIN_USERNAME and ADMIN_PASSWORD in backend/.env first.' });
  if (req.body.username !== username || req.body.password !== password) return res.status(401).json({ success: false, message: 'Incorrect admin username or password.' });
  const token = jwt.sign({ id: 'admin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  return res.json({ success: true, token });
}
