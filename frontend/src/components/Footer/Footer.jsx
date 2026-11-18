
import { assets } from '../../assets/assets'
import './Footer.css'
const Footer = () => {
  return (
    <div className='footer' id='footer'>
        <div className="footer-content">
            <div className="footer-content-left">
                    <img src={assets.logo} alt="" className='footer-logo' />
                    <p>
                        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Accusamus, possimus deserunt nihil molestias iusto minima vel laudantium doloribus culpa dolor rem nesciunt magni, sint at saepe autem quos non voluptates?
                    </p>
                    <div className="footer-social-icon">
                        <img src={assets.facebook_icon} alt="" />
                        <img src={assets.twitter_icon} alt="" />
                        <img src={assets.linkedin_icon} alt="" />
                    </div>
            </div>
            <div className="footer-content-center">
                    <h2>COMPANY</h2>
                    <ul>
                        <li>Home</li>
                        <li>About us</li>
                        <li>Delivery</li>
                        <li>Privacy policy</li>
                    </ul>
            </div>
            <div className="footer-content-right">
                <h2>GET IN TOUCH </h2>
                <ul>
                    <li>+91-1234567891</li>
                    <li>contact@foodihub.com</li>
                </ul>
            </div>
        </div>
        <hr />
        <p className="footer-copyright">By continuing past this page, you agree to our Terms of Service, Cookie Policy, Privacy Policy and Content Policies. All trademarks are properties of their respective owners
                                        2026 © FoodieHub™ Ltd. All rights reserved. </p>
    </div>
  )
}

export default Footer
