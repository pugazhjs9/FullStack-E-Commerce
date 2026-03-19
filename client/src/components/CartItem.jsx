import { useCart } from "../context/CartContext";

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { product, quantity } = item;

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(product.id);
    } else {
      await updateQuantity(product.id, newQuantity);
    }
  };

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        <img src={product.image} alt={product.name} />
      </div>

      <div className="cart-item-details">
        <h4 className="cart-item-name">{product.name}</h4>
        <span className="cart-item-category">{product.category}</span>
        <span className="cart-item-price">${product.price.toFixed(2)}</span>
      </div>

      <div className="cart-item-quantity">
        <button
          className="qty-btn"
          onClick={() => handleQuantityChange(quantity - 1)}
        >
          −
        </button>
        <span className="qty-value">{quantity}</span>
        <button
          className="qty-btn"
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={quantity >= product.stock}
        >
          +
        </button>
      </div>

      <div className="cart-item-total">
        <span className="item-total">
          ${(product.price * quantity).toFixed(2)}
        </span>
      </div>

      <button
        className="cart-item-remove"
        onClick={() => removeFromCart(product.id)}
        title="Remove item"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  );
};

export default CartItem;
