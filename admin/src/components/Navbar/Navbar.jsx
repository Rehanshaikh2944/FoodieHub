
import './Navbar.css';
import { assets } from '../../assets/assets';

const Navbar = ({ onLogout }) => {
  return (
    <header className="admin-navbar">
      <div className="admin-brand">
        <img className="logo" src={assets.logo} alt="FoodieHub logo" />
        <div>
          <span>FoodieHub</span>
          <strong>Admin dashboard</strong>
        </div>
      </div>

      <div className="admin-navbar-actions">
        <div className="admin-user-pill">
          <img className="profile" src={assets.profile_image} alt="Admin profile" />
          <span>Administrator</span>
        </div>
        <button type="button" className="admin-logout" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </header>
  );
};

export default Navbar;
