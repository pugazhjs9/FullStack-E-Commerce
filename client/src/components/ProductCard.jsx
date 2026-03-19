import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await addToCart(product.id);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="star filled">
            ★
          </span>,
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <span key={i} className="star half">
            ★
          </span>,
        );
      } else {
        stars.push(
          <span key={i} className="star">
            ★
          </span>,
        );
      }
    }
    return stars;
  };

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <div className="product-image-container">
        <img src={product.image} alt={product.name} className="product-image" />
        {product.featured && <span className="featured-badge">Featured</span>}
        {product.stock < 10 && product.stock > 0 && (
          <span className="stock-badge low">Only {product.stock} left</span>
        )}
        {product.stock === 0 && (
          <span className="stock-badge out">Out of Stock</span>
        )}
      </div>

      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>

        <div className="product-rating">
          <div className="stars">{renderStars(product.rating)}</div>
          <span className="review-count">({product.reviews})</span>
        </div>

        <div className="product-footer">
          <span className="product-price">${product.price.toFixed(2)}</span>
          <button
            className="btn btn-primary btn-sm add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
