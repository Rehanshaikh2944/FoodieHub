import { useState, useContext } from 'react';
import './LoginPopup.css';
import { assets } from '../../assets/assets';
import { API_URL, StoreContext } from '../../context/StoreContext';

const LoginPopup = ({ setShowLogin }) => {
  const [currState, setCurrState] = useState('Login');
  const [data, setData] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { setToken, setUser } = useContext(StoreContext);
  const onChange = (event) => setData((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const endpoint = currState === 'Login' ? 'login' : 'register';
      const response = await fetch(`${API_URL}/api/user/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Authentication failed.');
      setToken(result.token); setUser(result.user); setShowLogin(false);
    } catch (err) { setError(err.message || 'Could not connect to the server.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="login-popup" onClick={() => setShowLogin(false)}>
      <form className="login-popup-container" onSubmit={onSubmit} onClick={(e) => e.stopPropagation()}>
        <div className="login-popup-title"><h2>{currState}</h2><img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="Close" /></div>
        <div className="login-popup-inputs">
          {currState === 'Sign up' && <input name="name" value={data.name} onChange={onChange} type="text" placeholder="Your name" minLength="2" required />}
          <input name="email" value={data.email} onChange={onChange} type="email" placeholder="Your email" autoComplete="email" required />
          <input name="password" value={data.password} onChange={onChange} type="password" placeholder="Password (at least 8 characters)" minLength="8" autoComplete={currState === 'Login' ? 'current-password' : 'new-password'} required />
        </div>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button disabled={busy} type="submit">{busy ? 'Please wait…' : currState === 'Sign up' ? 'Create account' : 'Login'}</button>
        {currState === 'Sign up' && <div className="login-popup-condition"><input type="checkbox" required /><p>By creating an account, I agree to the terms of use and privacy policy.</p></div>}
        {currState === 'Login' ? <p>Create a new account? <span role="button" tabIndex="0" onClick={() => { setCurrState('Sign up'); setError(''); }}>Click here</span></p> : <p>Already have an account? <span role="button" tabIndex="0" onClick={() => { setCurrState('Login'); setError(''); }}>Login here</span></p>}
      </form>
    </div>
  );
};
export default LoginPopup;
