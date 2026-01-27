import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../services/api';

const Orders = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const isSuccess = searchParams.get('success') === 'true';

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                if (id) {
                    const order = await ordersApi.getById(id);
                    setSelectedOrder(order);
                } else {
                    const data = await ordersApi.getAll();
                    setOrders(data);
                }
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    const getStatusColor = (status) => {
        const colors = {
            pending: 'status-pending',
            processing: 'status-processing',
            shipped: 'status-shipped',
            delivered: 'status-delivered',
            cancelled: 'status-cancelled'
        };
        return colors[status] || '';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!user) {
        return (
            <div className="orders-page">
                <div className="empty-state">
                    <span className="empty-icon">🔒</span>
                    <h2>Please login to view orders</h2>
                    <Link to="/login" className="btn btn-primary">Login</Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="orders-page">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    // Single order view
    if (id && selectedOrder) {
        return (
            <div className="orders-page">
                {isSuccess && (
                    <div className="success-banner">
                        <span>🎉</span>
                        <h2>Order Placed Successfully!</h2>
                        <p>Thank you for your purchase. Your order is being processed.</p>
                    </div>
                )}

                <div className="order-detail">
                    <Link to="/orders" className="back-link">← Back to Orders</Link>

                    <div className="order-header">
                        <div>
                            <h1>Order #{selectedOrder.id}</h1>
                            <p className="order-date">Placed on {formatDate(selectedOrder.createdAt)}</p>
                        </div>
                        <span className={`order-status ${getStatusColor(selectedOrder.status)}`}>
                            {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </span>
                    </div>

                    <div className="order-content">
                        <div className="order-items-list">
                            <h3>Items</h3>
                            {selectedOrder.items.map((item, index) => (
                                <div key={index} className="order-item-row">
                                    <img src={item.image} alt={item.name} />
                                    <div className="item-details">
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-qty">Qty: {item.quantity}</span>
                                    </div>
                                    <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="order-sidebar">
                            <div className="shipping-info">
                                <h3>Shipping Address</h3>
                                <p>{selectedOrder.shippingAddress.name}</p>
                                <p>{selectedOrder.shippingAddress.address}</p>
                                <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}</p>
                                <p>{selectedOrder.shippingAddress.country}</p>
                            </div>

                            <div className="order-total-box">
                                <h3>Order Total</h3>
                                <p className="total-amount">${selectedOrder.total.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Orders list view
    return (
        <div className="orders-page">
            <h1>My Orders</h1>

            {orders.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">📦</span>
                    <h2>No orders yet</h2>
                    <p>Start shopping to see your orders here</p>
                    <Link to="/products" className="btn btn-primary">Browse Products</Link>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => (
                        <Link key={order.id} to={`/orders/${order.id}`} className="order-card">
                            <div className="order-card-header">
                                <div>
                                    <span className="order-id">Order #{order.id}</span>
                                    <span className="order-date">{formatDate(order.createdAt)}</span>
                                </div>
                                <span className={`order-status ${getStatusColor(order.status)}`}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                            </div>

                            <div className="order-card-items">
                                {order.items.slice(0, 3).map((item, index) => (
                                    <img key={index} src={item.image} alt={item.name} />
                                ))}
                                {order.items.length > 3 && (
                                    <span className="more-items">+{order.items.length - 3}</span>
                                )}
                            </div>

                            <div className="order-card-footer">
                                <span className="item-count">{order.items.length} item(s)</span>
                                <span className="order-total">${order.total.toFixed(2)}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;
