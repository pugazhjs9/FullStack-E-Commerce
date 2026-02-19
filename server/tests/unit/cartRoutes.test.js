const request = require('supertest');

jest.mock('../../src/utils/dataUtils');
const { readData, writeData } = require('../../src/utils/dataUtils');

const app = require('../../src/app');

// ─── Mock Data ────────────────────────────────────────────────────────────────

const AUTH_HEADER = 'Bearer token_1_12345';

const mockProducts = [
    { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics', stock: 10, image: 'img.jpg', rating: 4.5, reviews: 10, featured: false },
    { id: 2, name: 'T-Shirt', price: 19.99, category: 'Clothing', stock: 5, image: 'img2.jpg', rating: 3.8, reviews: 5, featured: false },
];

const mockCarts = [
    {
        userId: 1,
        items: [{ productId: 1, quantity: 2 }],
        updatedAt: '2024-01-01T00:00:00.000Z'
    }
];

const emptyCarts = [];

// Make readData return different data based on filename
const setupReadData = (carts = mockCarts) => {
    readData.mockImplementation((filename) => {
        if (filename === 'carts.json') return JSON.parse(JSON.stringify(carts));
        if (filename === 'products.json') return [...mockProducts];
        return [];
    });
};

beforeEach(() => {
    jest.clearAllMocks();
    writeData.mockReturnValue(true);
});

// ─── GET /api/cart ────────────────────────────────────────────────────────────

describe('GET /api/cart', () => {
    it('should return 401 when no auth token provided', async () => {
        setupReadData();
        const res = await request(app).get('/api/cart');
        expect(res.statusCode).toBe(401);
    });

    it('should return cart with enriched items and totals', async () => {
        setupReadData();
        const res = await request(app)
            .get('/api/cart')
            .set('Authorization', AUTH_HEADER);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('items');
        expect(res.body).toHaveProperty('itemCount');
        expect(res.body).toHaveProperty('subtotal');
        expect(res.body.items[0].product).toBeDefined();
        expect(res.body.items[0].product.name).toBe('Laptop');
    });

    it('should return empty cart when user has no cart', async () => {
        setupReadData(emptyCarts);
        const res = await request(app)
            .get('/api/cart')
            .set('Authorization', AUTH_HEADER);

        expect(res.statusCode).toBe(200);
        expect(res.body.items).toHaveLength(0);
        expect(res.body.itemCount).toBe(0);
        expect(res.body.subtotal).toBe(0);
    });

    it('should calculate correct subtotal', async () => {
        setupReadData();
        const res = await request(app)
            .get('/api/cart')
            .set('Authorization', AUTH_HEADER);

        // 2 * 999.99 = 1999.98
        expect(res.body.subtotal).toBe(1999.98);
        expect(res.body.itemCount).toBe(2);
    });
});

// ─── POST /api/cart ───────────────────────────────────────────────────────────

describe('POST /api/cart', () => {
    it('should return 401 when not authenticated', async () => {
        setupReadData();
        const res = await request(app)
            .post('/api/cart')
            .send({ productId: 1 });

        expect(res.statusCode).toBe(401);
    });

    it('should return 400 when productId is missing', async () => {
        setupReadData();
        const res = await request(app)
            .post('/api/cart')
            .set('Authorization', AUTH_HEADER)
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/product id/i);
    });

    it('should return 404 when product does not exist', async () => {
        setupReadData();
        const res = await request(app)
            .post('/api/cart')
            .set('Authorization', AUTH_HEADER)
            .send({ productId: 999 });

        expect(res.statusCode).toBe(404);
    });

    it('should add new item to cart', async () => {
        setupReadData();
        const res = await request(app)
            .post('/api/cart')
            .set('Authorization', AUTH_HEADER)
            .send({ productId: 2 });

        expect(res.statusCode).toBe(200);
        expect(writeData).toHaveBeenCalled();
    });

    it('should increment quantity if item already in cart', async () => {
        setupReadData();
        const res = await request(app)
            .post('/api/cart')
            .set('Authorization', AUTH_HEADER)
            .send({ productId: 1, quantity: 1 });

        expect(res.statusCode).toBe(200);
        const updatedCart = writeData.mock.calls[0][1];
        const userCart = updatedCart.find(c => c.userId === 1);
        const laptopItem = userCart.items.find(i => i.productId === 1);
        expect(laptopItem.quantity).toBe(3); // was 2, added 1
    });

    it('should create a new cart entry when user has no cart', async () => {
        setupReadData(emptyCarts);
        const res = await request(app)
            .post('/api/cart')
            .set('Authorization', AUTH_HEADER)
            .send({ productId: 1 });

        expect(res.statusCode).toBe(200);
        expect(writeData).toHaveBeenCalled();
    });
});

// ─── PUT /api/cart/:productId ─────────────────────────────────────────────────

describe('PUT /api/cart/:productId', () => {
    it('should return 401 when not authenticated', async () => {
        setupReadData();
        const res = await request(app)
            .put('/api/cart/1')
            .send({ quantity: 3 });
        expect(res.statusCode).toBe(401);
    });

    it('should return 404 when cart not found for user', async () => {
        setupReadData(emptyCarts);
        const res = await request(app)
            .put('/api/cart/1')
            .set('Authorization', AUTH_HEADER)
            .send({ quantity: 3 });
        expect(res.statusCode).toBe(404);
    });

    it('should return 404 when item not in cart', async () => {
        setupReadData();
        const res = await request(app)
            .put('/api/cart/99')
            .set('Authorization', AUTH_HEADER)
            .send({ quantity: 2 });
        expect(res.statusCode).toBe(404);
    });

    it('should update quantity of an existing item', async () => {
        setupReadData();
        const res = await request(app)
            .put('/api/cart/1')
            .set('Authorization', AUTH_HEADER)
            .send({ quantity: 5 });

        expect(res.statusCode).toBe(200);
        const savedCarts = writeData.mock.calls[0][1];
        const item = savedCarts[0].items.find(i => i.productId === 1);
        expect(item.quantity).toBe(5);
    });

    it('should remove item when quantity is set to 0', async () => {
        setupReadData();
        const res = await request(app)
            .put('/api/cart/1')
            .set('Authorization', AUTH_HEADER)
            .send({ quantity: 0 });

        expect(res.statusCode).toBe(200);
        const savedCarts = writeData.mock.calls[0][1];
        const item = savedCarts[0].items.find(i => i.productId === 1);
        expect(item).toBeUndefined();
    });
});

// ─── DELETE /api/cart/:productId ─────────────────────────────────────────────

describe('DELETE /api/cart/:productId', () => {
    it('should return 401 when not authenticated', async () => {
        setupReadData();
        const res = await request(app).delete('/api/cart/1');
        expect(res.statusCode).toBe(401);
    });

    it('should return 404 when item not in cart', async () => {
        setupReadData();
        const res = await request(app)
            .delete('/api/cart/99')
            .set('Authorization', AUTH_HEADER);
        expect(res.statusCode).toBe(404);
    });

    it('should remove the item from cart', async () => {
        setupReadData();
        const res = await request(app)
            .delete('/api/cart/1')
            .set('Authorization', AUTH_HEADER);

        expect(res.statusCode).toBe(200);
        const savedCarts = writeData.mock.calls[0][1];
        expect(savedCarts[0].items).toHaveLength(0);
    });
});

// ─── DELETE /api/cart ─────────────────────────────────────────────────────────

describe('DELETE /api/cart (clear)', () => {
    it('should return 401 when not authenticated', async () => {
        setupReadData();
        const res = await request(app).delete('/api/cart');
        expect(res.statusCode).toBe(401);
    });

    it('should clear all items from the cart', async () => {
        setupReadData();
        const res = await request(app)
            .delete('/api/cart')
            .set('Authorization', AUTH_HEADER);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/cleared/i);
        const savedCarts = writeData.mock.calls[0][1];
        expect(savedCarts[0].items).toHaveLength(0);
    });

    it('should succeed even when user has no cart', async () => {
        setupReadData(emptyCarts);
        const res = await request(app)
            .delete('/api/cart')
            .set('Authorization', AUTH_HEADER);

        expect(res.statusCode).toBe(200);
    });
});
