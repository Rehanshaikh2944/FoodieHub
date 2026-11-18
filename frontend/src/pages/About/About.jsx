import "./About.css";
import { assets } from "../../assets/assets";

import { useEffect } from 'react'



const About = () => {
        useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

  return (
    <div className="about-page">
      {/* About Hero */}
      <section className="about-hero">
        <h1>
          Food should feel <span>fun.</span>
        </h1>

        <p>
          FoodieHub makes discovering your favourite food simple, convenient,
          and enjoyable.
        </p>
      </section>

      {/* About Main Content */}
      <section className="about-main">
        {/* Left Card */}
        <div className="about-card">
          <img
            src={assets.menu_1}
            alt="Delicious food"
            className="about-food-image"
          />

          <h2>Simple.</h2>
          <h2>Useful.</h2>
          <h2>Delicious.</h2>
        </div>

        {/* Right Content */}
        <div className="about-content">
          <h2>Made for hungry people.</h2>

          <p>
            At FoodieHub, we make it easy to discover delicious dishes and enjoy
            your favourite meals.
          </p>

          {/* Feature 1 */}
          <div className="about-features">
            <div className="about-feature">
              <div className="about-feature-icon">🍽️</div>

              <div>
                <h3>Great Food Choices</h3>

                <p>Explore a variety of tasty dishes for every craving.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="about-feature">
              <div className="about-feature-icon">🛒</div>

              <div>
                <h3>Easy Ordering</h3>

                <p>
                  Choose your favourite food and add it to your cart with ease.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="about-feature">
              <div className="about-feature-icon">❤️</div>

              <div>
                <h3>Made for Food Lovers</h3>

                <p>
                  A friendly food-ordering experience made around what you love
                  to eat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
