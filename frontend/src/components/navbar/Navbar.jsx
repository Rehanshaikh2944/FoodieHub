import { useContext, useEffect, useState } from "react";
import { assets } from "../../assets/assets";
import "./Navbar.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";

const Navbar = ({ setShowLogin, searchTerm, setSearchTerm }) => {
  const [menu, setMenu] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const { getTotalCartAmount, user, logout } = useContext(StoreContext);
  const cartCount = getTotalCartAmount();

  useEffect(() => {
    if (!profileOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [profileOpen]);

  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (event) => {
      if (!event.target.closest(".navbar-profile-menu") && !event.target.closest(".navbar-user-trigger")) {
        setProfileOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [profileOpen]);

  const scrollToAnchor = (id) => {
    const target = document.getElementById(id);
    if (!target) return false;

    const top = target.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: "smooth" });
    return true;
  };

  const handleNavigateHome = () => {
    setMenu("home");
    setMobileOpen(false);

    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    navigate("/");
  };

  const handleMenuClick = (target) => {
    setMenu(target);
    setMobileOpen(false);

    if (target === "menu") {
      if (location.pathname === "/") {
        scrollToAnchor("explore-menu");
        return;
      }

      navigate("/");
      setTimeout(() => scrollToAnchor("explore-menu"), 120);
      return;
    }

    if (target === "home") {
      handleNavigateHome();
      return;
    }

    if (target === "my-orders") {
      navigate("/my-orders");
      return;
    }

    if (target === "about") {
      navigate("/about");
      return;
    }

    if (target === "contact-us") {
      if (location.pathname === "/") {
        scrollToAnchor("footer");
        return;
      }

      navigate("/");
      setTimeout(() => scrollToAnchor("footer"), 120);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const cleanedQuery = searchTerm.trim();
    setSearchTerm(cleanedQuery);

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        scrollToAnchor("explore-menu");
      }, 120);
      return;
    }

    scrollToAnchor("explore-menu");
  };

  const handleAuthButtonClick = () => {
    if (user) {
      setProfileOpen((open) => !open);
      return;
    }

    setShowLogin(true);
  };

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-shell">
          <Link to="/" onClick={handleNavigateHome} className="navbar-logo-link" aria-label="FoodieHub home">
            <img src={assets.logo} alt="FoodieHub logo" className="logo" />
          </Link>

          <nav className={`navbar-menu ${mobileOpen ? "open" : ""}`} aria-label="Main navigation">
            <Link to="/" onClick={(event) => {
              event.preventDefault();
              handleMenuClick("home");
            }} className={menu === "home" ? "active" : ""}>
              Home
            </Link>

            <Link to="/" onClick={(event) => {
              event.preventDefault();
              handleMenuClick("menu");
            }} className={menu === "menu" ? "active" : ""}>
              Menu
            </Link>

            <Link to="/my-orders" onClick={() => handleMenuClick("my-orders")} className={menu === "my-orders" ? "active" : ""}>
              My Orders
            </Link>

            <Link to="/about" onClick={() => handleMenuClick("about")} className={menu === "about" ? "active" : ""}>
              About
            </Link>

            <Link to="/" onClick={(event) => {
              event.preventDefault();
              handleMenuClick("contact-us");
            }} className={menu === "contact-us" ? "active" : ""}>
              Contact
            </Link>
          </nav>

          <div className="navbar-right">
            <form className="navbar-search" role="search" onSubmit={handleSearchSubmit}>
              <img src={assets.search_icon} alt="" className="navbar-search-icon" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search food..."
                aria-label="Search food"
              />
            </form>

            <div className="navbar-actions">
              <Link to="/cart" className="navbar-cart" aria-label="Open cart">
                <img src={assets.basket_icon} alt="" />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>

              {user ? (
                <>
                  <button
                    type="button"
                    className="navbar-user-trigger"
                    onClick={handleAuthButtonClick}
                    aria-label="Open account menu"
                    aria-expanded={profileOpen}
                    title="Account"
                  >
                    <span className="navbar-user-avatar">
                      <img src={assets.profile_icon} alt="" />
                    </span>
                  </button>

                  {profileOpen && (
                    <div className="navbar-profile-menu" role="menu" aria-label="Account options">
                      <button
                        type="button"
                        className="navbar-profile-menu-item"
                        onClick={handleLogout}
                        aria-label="Logout"
                      >
                        <img src={assets.logout_icon} alt="" className="navbar-profile-menu-icon" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button type="button" className="navbar-signin" onClick={() => setShowLogin(true)}>
                  Sign In
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
    </>
  );
};

export default Navbar;
