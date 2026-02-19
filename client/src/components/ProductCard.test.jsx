import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import * as api from '../services/api';

// ─── Mock dependencies ────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/api', () => ({
    authApi: { getMe: vi.fn() },
    cartApi: { get: vi.fn(), add: vi.fn(), update: vi.fn(), remove: vi.fn(), clear: vi.fn() },
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
    AuthProvider: ({ children }) => <>{children}</>,
}));

vi.mock('../context/CartContext', () => ({
    useCart: vi.fn(),
    CartProvider: ({ children }) => <>{children}</>,
}));

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// ─── Mock Product ─────────────────────────────────────────────────────────────

const mockProduct = {
    id: 1,
    name: 'Laptop',
    description: 'A powerful laptop',
    price: 999.99,
    category: 'Electronics',
    image: 'https://example.com/laptop.jpg',
    rating: 4.5,
    reviews: 128,
    stock: 10,
    featured: true
};

const outOfStockProduct = { ...mockProduct, id: 2, stock: 0 };
const lowStockProduct = { ...mockProduct, id: 3, stock: 3 };

// ─── Setup ────────────────────────────────────────────────────────────────────

const mockAddToCart = vi.fn();

function renderCard(product = mockProduct, user = null) {
    useAuth.mockReturnValue({ user, loading: false, login: vi.fn(), logout: vi.fn(), register: vi.fn() });
    useCart.mockReturnValue({ cart: { items: [], itemCount: 0 }, addToCart: mockAddToCart, updateQuantity: vi.fn(), removeFromCart: vi.fn(), clearCart: vi.fn(), loading: false });

    return render(
        <MemoryRouter>
            <ProductCard product={product} />
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    mockAddToCart.mockResolvedValue(undefined);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProductCard', () => {
    it('should render product name, category, and price', () => {
        renderCard();

        expect(screen.getByText('Laptop')).toBeInTheDocument();
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('$999.99')).toBeInTheDocument();
    });

    it('should render product image with alt text', () => {
        renderCard();
        const img = screen.getByAltText('Laptop');
        expect(img).toBeInTheDocument();
        expect(img.src).toBe('https://example.com/laptop.jpg');
    });

    it('should display review count', () => {
        renderCard();
        expect(screen.getByText('(128)')).toBeInTheDocument();
    });

    it('should show the "Featured" badge for featured products', () => {
        renderCard();
        expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('should NOT show "Featured" badge for non-featured products', () => {
        renderCard({ ...mockProduct, featured: false });
        expect(screen.queryByText('Featured')).not.toBeInTheDocument();
    });

    it('should show "Add to Cart" button when product is in stock', () => {
        renderCard();
        const btn = screen.getByRole('button', { name: 'Add to Cart' });
        expect(btn).toBeInTheDocument();
        expect(btn).not.toBeDisabled();
    });

    it('should show "Sold Out" disabled button when stock is 0', () => {
        renderCard(outOfStockProduct);
        const btn = screen.getByRole('button', { name: 'Sold Out' });
        expect(btn).toBeDisabled();
    });

    it('should show low stock badge when stock < 10 and > 0', () => {
        renderCard(lowStockProduct);
        expect(screen.getByText(/Only 3 left/i)).toBeInTheDocument();
    });

    it('should navigate to product detail page when card is clicked', async () => {
        renderCard();

        fireEvent.click(screen.getByText('Laptop').closest('.product-card'));

        expect(mockNavigate).toHaveBeenCalledWith('/products/1');
    });

    it('should redirect to /login when unauthenticated user clicks "Add to Cart"', async () => {
        renderCard(mockProduct, null); // Not logged in

        await userEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

        expect(mockNavigate).toHaveBeenCalledWith('/login');
        expect(mockAddToCart).not.toHaveBeenCalled();
    });

    it('should call addToCart when authenticated user clicks "Add to Cart"', async () => {
        const user = { id: 1, name: 'Alice' };
        renderCard(mockProduct, user);

        await userEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

        expect(mockAddToCart).toHaveBeenCalledWith(1);
        expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });

    it('clicking "Add to Cart" should not navigate to product detail (stopPropagation)', async () => {
        const user = { id: 1, name: 'Alice' };
        renderCard(mockProduct, user);

        await userEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

        // navigate should not be called with the product detail route
        expect(mockNavigate).not.toHaveBeenCalledWith('/products/1');
    });

    it('should render 5 star elements', () => {
        renderCard();
        const stars = screen.getAllByText('★');
        expect(stars).toHaveLength(5);
    });
});
