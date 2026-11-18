import { useEffect, useState } from "react";
import "./Header.css";

const Header = () => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = () => setReduceMotion(mediaQuery.matches);
    handleChange();

    mediaQuery.addEventListener?.("change", handleChange);

    return () => {
      mediaQuery.removeEventListener?.("change", handleChange);
    };
  }, []);

  const handleViewMenu = () => {
    document.getElementById("explore-menu")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <header className="header">
      <video
        className="header-video"
        autoPlay={!reduceMotion}
        muted
        loop={!reduceMotion}
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/videos/hero-food.mp4" type="video/mp4" />
      </video>

      <div className="header-overlay" aria-hidden="true" />

      <div className="header-content">
        <span className="header-badge">FoodieHub · Fresh delivery</span>

        <h1>
          Fresh flavors,
          <span> delivered with joy.</span>
        </h1>

        <p>
          Discover comforting classics and chef-crafted favorites, all made to
          order and delivered hot to your door.
        </p>

        <div className="header-actions">
          <button className="primary-button" onClick={handleViewMenu}>
            Explore menu
          </button>
          <a className="secondary-button" href="#explore-menu" onClick={handleViewMenu}>
            View menu
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
