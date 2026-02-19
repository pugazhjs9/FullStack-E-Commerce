import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { productsApi, authApi, cartApi, ordersApi, healthApi } from '../services/api';

// ─── Setup ────────────────────────────────────────────────────────────────────

let fetchMock;

beforeEach(() => {
    // Mock global fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // Clear localStorage
    localStorage.clear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockFetchSuccess(data, status = 200) {
    fetchMock.mockResolvedValueOnce({
        ok: true,
        status,
        json: async () => data,
    });
}

function mockFetchError(data, status = 400) {
    fetchMock.mockResolvedValueOnce({
        ok: false,
        status,
        json: async () => data,
    });
}

// ─── productsApi ─────────────────────────────────────────────────────────────

describe('productsApi.getAll', () => {
    it('should fetch all products', async () => {
        const mockProducts = [{ id: 1, name: 'Laptop' }];
        mockFetchSuccess(mockProducts);

        const result = await productsApi.getAll();

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/api/products'),
            expect.any(Object)
        );
        expect(result).toEqual(mockProducts);
    });

    it('should append query params when provided', async () => {
        mockFetchSuccess([]);

        await productsApi.getAll({ category: 'Electronics', search: 'lap' });

        const calledUrl = fetchMock.mock.calls[0][0];
        expect(calledUrl).toContain('category=Electronics');
        expect(calledUrl).toContain('search=lap');
    });

    it('should throw an error when response is not ok', async () => {
        mockFetchError({ error: 'Failed to fetch products' });

        await expect(productsApi.getAll()).rejects.toThrow('Failed to fetch products');
    });
});

describe('productsApi.getById', () => {
    it('should fetch a product by id', async () => {
        const mockProduct = { id: 1, name: 'Laptop' };
        mockFetchSuccess(mockProduct);

        const result = await productsApi.getById(1);

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/api/products/1'),
            expect.any(Object)
        );
        expect(result).toEqual(mockProduct);
    });
});

describe('productsApi.getCategories', () => {
    it('should fetch product categories', async () => {
        mockFetchSuccess(['Electronics', 'Clothing']);
        const result = await productsApi.getCategories();
        expect(result).toEqual(['Electronics', 'Clothing']);
    });
});

// ─── authApi ──────────────────────────────────────────────────────────────────

describe('authApi.register', () => {
    it('should POST to /api/auth/register with user data', async () => {
        const mockResponse = { user: { id: 1, name: 'Alice' }, token: 'tok_1' };
        mockFetchSuccess(mockResponse, 201);

        const result = await authApi.register({ name: 'Alice', email: 'a@a.com', password: 'pass' });

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/register'),
            expect.objectContaining({ method: 'POST' })
        );
        expect(result).toEqual(mockResponse);
    });

    it('should throw error on failed registration', async () => {
        mockFetchError({ error: 'Email already registered' });

        await expect(
            authApi.register({ name: 'A', email: 'dup@test.com', password: 'p' })
        ).rejects.toThrow('Email already registered');
    });
});

describe('authApi.login', () => {
    it('should POST credentials to /api/auth/login', async () => {
        const mockResponse = { user: { id: 1 }, token: 'tok_1_12345' };
        mockFetchSuccess(mockResponse);

        const result = await authApi.login({ email: 'a@a.com', password: 'pass' });

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/login'),
            expect.objectContaining({ method: 'POST' })
        );
        expect(result.token).toBe('tok_1_12345');
    });

    it('should throw error on invalid credentials', async () => {
        mockFetchError({ error: 'Invalid email or password' }, 401);
        await expect(authApi.login({ email: 'x', password: 'y' })).rejects.toThrow();
    });
});

describe('authApi.getMe', () => {
    it('should GET /api/auth/me with auth header', async () => {
        localStorage.setItem('token', 'mytoken');
        mockFetchSuccess({ id: 1, name: 'Alice' });

        const result = await authApi.getMe();

        const headers = fetchMock.mock.calls[0][1].headers;
        expect(headers.Authorization).toBe('Bearer mytoken');
        expect(result.name).toBe('Alice');
    });
});

// ─── cartApi ──────────────────────────────────────────────────────────────────

describe('cartApi', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'tok_1_12345');
    });

    it('cartApi.get should GET /api/cart', async () => {
        const mockCart = { items: [], itemCount: 0, subtotal: 0 };
        mockFetchSuccess(mockCart);

        const result = await cartApi.get();
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/api/cart'),
            expect.any(Object)
        );
        expect(result).toEqual(mockCart);
    });

    it('cartApi.add should POST to /api/cart', async () => {
        mockFetchSuccess({ message: 'Item added' });

        await cartApi.add(1, 2);

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toContain('/api/cart');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body)).toEqual({ productId: 1, quantity: 2 });
    });

    it('cartApi.update should PUT to /api/cart/:productId', async () => {
        mockFetchSuccess({ message: 'Cart updated' });

        await cartApi.update(1, 3);

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toContain('/api/cart/1');
        expect(options.method).toBe('PUT');
    });

    it('cartApi.remove should DELETE /api/cart/:productId', async () => {
        mockFetchSuccess({ message: 'Item removed' });

        await cartApi.remove(1);

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toContain('/api/cart/1');
        expect(options.method).toBe('DELETE');
    });

    it('cartApi.clear should DELETE /api/cart', async () => {
        mockFetchSuccess({ message: 'Cart cleared' });

        await cartApi.clear();

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toContain('/api/cart');
        expect(options.method).toBe('DELETE');
    });
});

// ─── ordersApi ────────────────────────────────────────────────────────────────

describe('ordersApi', () => {
    it('ordersApi.getAll should GET /api/orders', async () => {
        mockFetchSuccess([]);
        await ordersApi.getAll();
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/api/orders'),
            expect.any(Object)
        );
    });

    it('ordersApi.create should POST to /api/orders', async () => {
        const shipping = { name: 'Alice', address: '123 St', city: 'NYC', zip: '10001' };
        mockFetchSuccess({ order: { id: 1 } }, 201);

        await ordersApi.create(shipping);

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toContain('/api/orders');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body)).toEqual({ shippingAddress: shipping });
    });
});

// ─── healthApi ────────────────────────────────────────────────────────────────

describe('healthApi', () => {
    it('should GET /api/health', async () => {
        mockFetchSuccess({ status: 'ok' });
        const result = await healthApi.check();
        expect(result.status).toBe('ok');
    });
});
