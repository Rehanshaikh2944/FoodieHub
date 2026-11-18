import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import Add from './pages/Add/Add';
import List from './pages/List/List';
import Orders from './pages/Orders/Orders';
import api from './utils/api';
import './admin-auth.css';

function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      const { data } = await api.post('/api/user/admin/login', {
        username: form.username,
        password: form.password,
      });

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('foodiehub-admin-token', data.token);
      onLogin(data.token);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-auth-page">
      <div className="admin-auth-panel">
        <div className="admin-auth-header">
          <span className="admin-kicker">Control panel</span>
          <h1>FoodieHub Admin</h1>
          <p>Manage the menu and keep every customer order moving.</p>
        </div>

        <form className="admin-auth-form" onSubmit={submit}>
          <div className="admin-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              placeholder="Enter admin username"
              required
            />
          </div>

          <div className="admin-field">
            <div className="admin-field-header">
              <label htmlFor="password">Password</label>
              <button
                type="button"
                className="admin-ghost-button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="admin-primary-button" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in to dashboard'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('foodiehub-admin-token') || '');

  const logout = () => {
    localStorage.removeItem('foodiehub-admin-token');
    setToken('');
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        toastClassName="foodiehub-toast"
        bodyClassName="foodiehub-toast-body"
        progressClassName="foodiehub-toast-progress"
        closeButton={({ closeToast }) => (
          <button
            type="button"
            className="foodiehub-toast-close"
            onClick={closeToast}
            aria-label="Close notification"
          >
            ×
          </button>
        )}
      />

      {!token ? (
        <AdminLogin onLogin={setToken} />
      ) : (
        <div className="admin-app-shell">
          <Navbar onLogout={logout} />

          <div className="admin-body">
            <Sidebar />

            <main className="admin-page">
              <Routes>
                <Route path="/" element={<Navigate to="/orders" replace />} />
                <Route path="/add" element={<Add />} />
                <Route path="/list" element={<List />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="*" element={<Navigate to="/orders" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      )}
    </>
  );
}

