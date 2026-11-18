import { createContext, useCallback, useEffect, useState } from 'react';

export const StoreContext = createContext(null);
export const API_URL = (
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '' : 'http://localhost:4000')
).replace(/\/$/, '');

export const getFoodImageUrl = (image) => {
  if (!image) return '';
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  return `${API_URL ? `${API_URL}/images` : '/images'}/${String(image).replace(/^\/+/, '')}`;
};

const readJSON = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
};

const StoreContextProvider = ({ children }) => {
  const [food_list, setFoodList] = useState([]);
  const [foodLoading, setFoodLoading] = useState(true);
  const [foodError, setFoodError] = useState('');
  const [cartItems, setCartItems] = useState(() => readJSON('foodiehub-cart', {}));
  const [token, setToken] = useState(() => localStorage.getItem('foodiehub-token') || '');
  const [user, setUser] = useState(() => readJSON('foodiehub-user', null));

  const refreshFood = useCallback(async () => {
    setFoodLoading(true); setFoodError('');
    try {
      const response = await fetch(`${API_URL}/api/food/list`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not load the menu.');
      setFoodList(Array.isArray(result.data) ? result.data : []);
    } catch (error) { setFoodError(error.message || 'Unable to connect to FoodieHub.'); }
    finally { setFoodLoading(false); }
  }, []);

  useEffect(() => { refreshFood(); }, [refreshFood]);
  // Remove stale cart IDs only after a successful menu fetch (never while the menu is still loading).
  useEffect(() => {
    if (foodLoading || foodError) return;
    const validIds = new Set(food_list.map((food) => String(food._id)));
    setCartItems((previous) => {
      const next = Object.fromEntries(Object.entries(previous).filter(([id, quantity]) => validIds.has(id) && Number.isInteger(Number(quantity)) && Number(quantity) > 0));
      return Object.keys(next).length === Object.keys(previous).length ? previous : next;
    });
  }, [food_list, foodLoading, foodError]);
  useEffect(() => { localStorage.setItem('foodiehub-cart', JSON.stringify(cartItems)); }, [cartItems]);
  useEffect(() => { token ? localStorage.setItem('foodiehub-token', token) : localStorage.removeItem('foodiehub-token'); }, [token]);
  useEffect(() => { user ? localStorage.setItem('foodiehub-user', JSON.stringify(user)) : localStorage.removeItem('foodiehub-user'); }, [user]);

  const addToCart = (itemId) => setCartItems((prev) => ({ ...prev, [itemId]: Math.min(99, (Number(prev[itemId]) || 0) + 1) }));
  const removeFromCart = (itemId) => setCartItems((prev) => {
    const next = { ...prev };
    if ((Number(next[itemId]) || 0) > 1) next[itemId] -= 1; else delete next[itemId];
    return next;
  });
  const clearCart = useCallback(() => setCartItems({}), []);
  const getTotalCartAmount = () => Object.values(cartItems).reduce((sum, qty) => sum + Math.max(0, Number(qty) || 0), 0);
  const getSubtotal = () => food_list.reduce((sum, item) => sum + (item.price * (Number(cartItems[item._id]) || 0)), 0);
  const logout = () => { setToken(''); setUser(null); };

  const contextValue = { food_list, foodLoading, foodError, refreshFood, cartItems, setCartItems, addToCart, removeFromCart, clearCart, getTotalCartAmount, getSubtotal, token, setToken, user, setUser, logout };
  return <StoreContext.Provider value={contextValue}>{children}</StoreContext.Provider>;
};

export default StoreContextProvider;
