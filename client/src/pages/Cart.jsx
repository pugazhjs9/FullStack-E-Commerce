import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartItem from '../components/CartItem';

const Cart = () => {
    const { cart, loading, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return (
            <div className="cart-page">
                <div className="empty-cart">
                    <span className="empty-icon">🔒</span>
                    <h2>Please login to view your cart</h2>
                    <Link to="/login" className="btn btn-primary">
                        Login
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="cart-page">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (cart.items.length === 0) {
        return (
            <div className="cart-page">
                <div className="empty-cart">
                    <span className="empty-icon">🛒</span>
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven't added any items yet</p>
                    <Link to="/products" className="btn btn-primary">
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    const shipping = cart.subtotal >= 50 ? 0 : 5.99;
    const tax = cart.subtotal * 0.08;
    const total = cart.subtotal + shipping + tax;

    return (
        <div className="cart-page">
            <h1>Shopping Cart</h1>

            <div className="cart-layout">
                <div className="cart-items">
                    <div className="cart-header">
                        <span>Product</span>
                        <span>Quantity</span>
                        <span>Total</span>
                        <span></span>
                    </div>

                    {cart.items.map(item => (
                        <CartItem key={item.productId} item={item} />
                    ))}

                    <button className="clear-cart-btn" onClick={clearCart}>
                        Clear Cart
                    </button>
                </div>

                <div className="cart-summary">
                    <h3>Order Summary</h3>

                    <div className="summary-row">
                        <span>Subtotal ({cart.itemCount} items)</span>
                        <span>${cart.subtotal.toFixed(2)}</span>
                    </div>

                    <div className="summary-row">
                        <span>Shipping</span>
                        <span>
                            {shipping === 0 ? (
                                <span className="free-shipping">FREE</span>
                            ) : (
                                `$${shipping.toFixed(2)}`
                            )}
                        </span>
                    </div>

                    {shipping > 0 && (
                        <p className="shipping-note">
                            Add ${(50 - cart.subtotal).toFixed(2)} more for free shipping
                        </p>
                    )}

                    <div className="summary-row">
                        <span>Estimated Tax</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>

                    <div className="summary-row total">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>

                    <button
                        className="btn btn-primary btn-lg checkout-btn"
                        onClick={() => navigate('/checkout')}
                    >
                        Proceed to Checkout
                    </button>

                    <Link to="/products" className="continue-shopping">
                        ← Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Cart;
