
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { to: '/orders', label: 'Orders', icon: '◫' },
  { to: '/add', label: 'Add Item', icon: '+' },
  { to: '/list', label: 'Menu List', icon: '☰' },
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-badge">FH</div>
        <div>
          <strong>Operations</strong>
          <span>Restaurant hub</span>
        </div>
      </div>

      <nav className="sidebar-options" aria-label="Admin navigation">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className="sidebar-option">
            <span className="sidebar-option-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
