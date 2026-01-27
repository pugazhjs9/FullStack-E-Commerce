import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../services/api';
import ProductCard from '../components/ProductCard';

const Home = () => {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [products, cats] = await Promise.all([
                    productsApi.getAll({ featured: 'true' }),
                    productsApi.getCategories()
                ]);
                setFeaturedProducts(products.slice(0, 4));
                setCategories(cats);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const categoryIcons = {
        Electronics: '💻',
        Fashion: '👕',
        Home: '🏠',
        Sports: '⚽'
    };

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Discover <span className="gradient-text">Amazing</span> Products
                    </h1>
                    <p className="hero-subtitle">
                        Shop the latest trends with unbeatable prices. Free shipping on orders over $50.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/products" className="btn btn-primary btn-lg">
                            Shop Now
                        </Link>
                        <Link to="/products?featured=true" className="btn btn-outline btn-lg">
                            View Featured
                        </Link>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="floating-cards">
                        <div className="floating-card card-1">🎧</div>
                        <div className="floating-card card-2">⌚</div>
                        <div className="floating-card card-3">📱</div>
                        <div className="floating-card card-4">👟</div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="categories-section">
                <h2 className="section-title">Shop by Category</h2>
                <div className="categories-grid">
                    {categories.map(category => (
                        <Link
                            key={category}
                            to={`/products?category=${category}`}
                            className="category-card"
                        >
                            <span className="category-icon">{categoryIcons[category] || '📦'}</span>
                            <span className="category-name">{category}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Featured Products */}
            <section className="featured-section">
                <div className="section-header">
                    <h2 className="section-title">Featured Products</h2>
                    <Link to="/products?featured=true" className="view-all">
                        View All →
                    </Link>
                </div>

                {loading ? (
                    <div className="loading-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="product-card-skeleton"></div>
                        ))}
                    </div>
                ) : (
                    <div className="products-grid">
                        {featuredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </section>

            {/* Benefits Section */}
            <section className="benefits-section">
                <div className="benefit-card">
                    <span className="benefit-icon">🚚</span>
                    <h3>Free Shipping</h3>
                    <p>On orders over $50</p>
                </div>
                <div className="benefit-card">
                    <span className="benefit-icon">🔒</span>
                    <h3>Secure Payment</h3>
                    <p>100% secure checkout</p>
                </div>
                <div className="benefit-card">
                    <span className="benefit-icon">↩️</span>
                    <h3>Easy Returns</h3>
                    <p>30-day return policy</p>
                </div>
                <div className="benefit-card">
                    <span className="benefit-icon">💬</span>
                    <h3>24/7 Support</h3>
                    <p>Dedicated support team</p>
                </div>
            </section>
        </div>
    );
};

export default Home;
