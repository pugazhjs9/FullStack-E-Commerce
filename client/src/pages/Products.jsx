import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '../services/api';
import ProductCard from '../components/ProductCard';

const Products = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const currentCategory = searchParams.get('category') || 'all';
    const currentSort = searchParams.get('sort') || '';
    const currentSearch = searchParams.get('search') || '';

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = {};
                if (currentCategory !== 'all') params.category = currentCategory;
                if (currentSort) params.sort = currentSort;
                if (currentSearch) params.search = currentSearch;

                const data = await productsApi.getAll(params);
                setProducts(data);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [currentCategory, currentSort, currentSearch]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await productsApi.getCategories();
                setCategories(data);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const handleCategoryChange = (category) => {
        const params = new URLSearchParams(searchParams);
        if (category === 'all') {
            params.delete('category');
        } else {
            params.set('category', category);
        }
        setSearchParams(params);
    };

    const handleSortChange = (sort) => {
        const params = new URLSearchParams(searchParams);
        if (sort) {
            params.set('sort', sort);
        } else {
            params.delete('sort');
        }
        setSearchParams(params);
    };

    return (
        <div className="products-page">
            <div className="products-header">
                <h1>
                    {currentSearch ? `Search: "${currentSearch}"` :
                        currentCategory !== 'all' ? currentCategory : 'All Products'}
                </h1>
                <p className="product-count">{products.length} products found</p>
            </div>

            <div className="products-layout">
                {/* Filters Sidebar */}
                <aside className="filters-sidebar">
                    <div className="filter-group">
                        <h3>Categories</h3>
                        <ul className="filter-list">
                            <li>
                                <button
                                    className={`filter-btn ${currentCategory === 'all' ? 'active' : ''}`}
                                    onClick={() => handleCategoryChange('all')}
                                >
                                    All Products
                                </button>
                            </li>
                            {categories.map(cat => (
                                <li key={cat}>
                                    <button
                                        className={`filter-btn ${currentCategory === cat ? 'active' : ''}`}
                                        onClick={() => handleCategoryChange(cat)}
                                    >
                                        {cat}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="filter-group">
                        <h3>Sort By</h3>
                        <select
                            className="sort-select"
                            value={currentSort}
                            onChange={(e) => handleSortChange(e.target.value)}
                        >
                            <option value="">Default</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Highest Rated</option>
                            <option value="name">Name: A-Z</option>
                        </select>
                    </div>
                </aside>

                {/* Products Grid */}
                <main className="products-main">
                    {loading ? (
                        <div className="products-grid">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="product-card-skeleton"></div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="no-products">
                            <span className="no-products-icon">🔍</span>
                            <h3>No products found</h3>
                            <p>Try adjusting your filters or search terms</p>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Products;
