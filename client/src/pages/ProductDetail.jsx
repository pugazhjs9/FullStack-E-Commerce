import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { productsApi } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productsApi.getById(id);
        setProduct(data);
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      setMessage("Added to cart!");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage("Failed to add to cart");
    } finally {
      setAddingToCart(false);
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

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-skeleton">
          <div className="skeleton-image"></div>
          <div className="skeleton-info">
            <div className="skeleton-title"></div>
            <div className="skeleton-price"></div>
            <div className="skeleton-desc"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="not-found">
          <h2>Product not found</h2>
          <button
            onClick={() => navigate("/products")}
            className="btn btn-primary"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="product-detail-container">
        <div className="product-detail-image">
          <img src={product.image} alt={product.name} />
          {product.featured && <span className="featured-badge">Featured</span>}
        </div>

        <div className="product-detail-info">
          <span className="product-category">{product.category}</span>
          <h1 className="product-name">{product.name}</h1>

          <div className="product-rating">
            <div className="stars">{renderStars(product.rating)}</div>
            <span className="rating-text">
              {product.rating} ({product.reviews} reviews)
            </span>
          </div>

          <p className="product-price">${product.price.toFixed(2)}</p>

          <p className="product-description">{product.description}</p>

          <div className="stock-info">
            {product.stock > 10 ? (
              <span className="in-stock">✓ In Stock</span>
            ) : product.stock > 0 ? (
              <span className="low-stock">⚠ Only {product.stock} left</span>
            ) : (
              <span className="out-of-stock">✕ Out of Stock</span>
            )}
          </div>

          {product.stock > 0 && (
            <div className="add-to-cart-section">
              <div className="quantity-selector">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>

              <button
                className="btn btn-primary btn-lg add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          )}

          {message && (
            <div
              className={`message ${message.includes("Failed") ? "error" : "success"}`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
