import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-brand">
            <span className="brand-icon">🛒</span>
            <span className="brand-text">ShopSmart</span>
          </div>
          <p className="footer-tagline">
            Your one-stop shop for everything you need. Quality products,
            amazing prices.
          </p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/products">Products</Link>
            </li>
            <li>
              <Link to="/cart">Cart</Link>
            </li>
            <li>
              <Link to="/orders">Orders</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Categories</h4>
          <ul className="footer-links">
            <li>
              <Link to="/products?category=Electronics">Electronics</Link>
            </li>
            <li>
              <Link to="/products?category=Fashion">Fashion</Link>
            </li>
            <li>
              <Link to="/products?category=Home">Home</Link>
            </li>
            <li>
              <Link to="/products?category=Sports">Sports</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact</h4>
          <ul className="footer-links">
            <li>📧 support@shopsmart.com</li>
            <li>📞 1-800-SHOP-NOW</li>
            <li>📍 San Francisco, CA</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 ShopSmart. All rights reserved.</p>
        <div className="footer-social">
          <a href="#" className="social-link">
            Twitter
          </a>
          <a href="#" className="social-link">
            Instagram
          </a>
          <a href="#" className="social-link">
            Facebook
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
