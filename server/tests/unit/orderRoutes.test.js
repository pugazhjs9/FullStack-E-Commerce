const request = require('supertest');

jest.mock('../../src/utils/dataUtils');
const { readData, writeData, generateId } = require('../../src/utils/dataUtils');

const app = require('../../src/app');

// ─── Mock Data ────────────────────────────────────────────────────────────────

const AUTH_HEADER = 'Bearer token_1_12345';

const mockProducts = [
    { id: 1, name: 'Laptop', price: 999.99, image: 'img.jpg' },
    { id: 2, name: 'T-Shirt', price: 19.99, image: 'img2.jpg' },
];

const mockOrders = [
    {
        id: 1,
        userId: 1,
        items: [{ productId: 1, name: 'Laptop', price: 999.99, quantity: 1, image: 'img.jpg' }],
        total: 999.99,
        status: 'pending',
        shippingAddress: { name: 'Alice', address: '123 Main St', city: 'NYC', zip: '10001' },
        createdAt: '2024-02-01T00:00:00.000Z',
    },
    {
        id: 2,
        userId: 2, // Different user
        items: [],
        total: 0,
        status: 'shipped',
        shippingAddress: {},
        createdAt: '2024-01-01T00:00:00.000Z',
    },
];

const mockCartWithItems = [
    {
        userId: 1,
        items: [{ productId: 1, quantity: 2 }],
        updatedAt: '2024-01-01T00:00:00.000Z',
    },
];

const mockEmptyCart = [
    {
        userId: 1,
        items: [],
        updatedAt: '2024-01-01T00:00:00.000Z',
    },
];

const setupReadData = ({
    orders = mockOrders,
    carts = mockCartWithItems,
    products = mockProducts,
} = {}) => {
    readData.mockImplementation(filename => {
        if (filename === 'orders.json') return JSON.parse(JSON.stringify(orders));
        if (filename === 'carts.json') return JSON.parse(JSON.stringify(carts));
        if (filename === 'products.json') return [...products];
        return [];
    });
};

beforeEach(() => {
    jest.clearAllMocks();
    writeData.mockReturnValue(true);
    generateId.mockReturnValue(3);
});

// ─── GET /api/orders ──────────────────────────────────────────────────────────

describe('GET /api/orders', () => {
    it('should return 401 when not authenticated', async () => {
        setupReadData();
        const res = await request(app).get('/api/orders');
        expect(res.statusCode).toBe(401);
    });

    it("should return only the authenticated user's orders", async () => {
        setupReadData();
        const res = await request(app).get('/api/orders').set('Authorization', AUTH_HEADER);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].userId).toBe(1);
    });

    it('should return orders sorted by most recent first', async () => {
        const multipleOrders = [
            { ...mockOrders[0], id: 2, createdAt: '2024-01-01T00:00:00.000Z', userId: 1 },
            { ...mockOrders[0], id: 3, createdAt: '2024-03-01T00:00:00.000Z', userId: 1 },
        ];
        setupReadData({ orders: multipleOrders });
        const res = await request(app).get('/api/orders').set('Authorization', AUTH_HEADER);

        expect(res.statusCode).toBe(200);
        // Most recent order should appear first
        const first = new Date(res.body[0].createdAt).getTime();
        const second = new Date(res.body[1].createdAt).getTime();
        expect(first).toBeGreaterThanOrEqual(second);
    });
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────

describe('GET /api/orders/:id', () => {
    it('should return 401 when not authenticated', async () => {
        setupReadData();
        const res = await request(app).get('/api/orders/1');
        expect(res.statusCode).toBe(401);
    });

    it('should return 404 for unknown order id', async () => {
        setupReadData();
        const res = await request(app).get('/api/orders/999').set('Authorization', AUTH_HEADER);
        expect(res.statusCode).toBe(404);
    });

    it('should return 404 when order belongs to another user', async () => {
        setupReadData();
        const res = await request(app)
            .get('/api/orders/2') // Order belongs to userId 2
            .set('Authorization', AUTH_HEADER); // But we're user 1
        expect(res.statusCode).toBe(404);
    });

    it('should return the order for valid id and owner', async () => {
        setupReadData();
        const res = await request(app).get('/api/orders/1').set('Authorization', AUTH_HEADER);

        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(1);
        expect(res.body.userId).toBe(1);
    });
});

// ─── POST /api/orders ─────────────────────────────────────────────────────────

describe('POST /api/orders', () => {
    const validShipping = {
        shippingAddress: {
            name: 'Alice',
            address: '123 Main St',
            city: 'New York',
            zip: '10001',
        },
    };

    it('should return 401 when not authenticated', async () => {
        setupReadData();
        const res = await request(app).post('/api/orders').send(validShipping);
        expect(res.statusCode).toBe(401);
    });

    it('should return 400 when shipping address is incomplete', async () => {
        setupReadData();
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', AUTH_HEADER)
            .send({ shippingAddress: { name: 'Alice' } }); // missing fields

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/shipping address/i);
    });

    it('should return 400 when cart is empty', async () => {
        setupReadData({ carts: mockEmptyCart });
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', AUTH_HEADER)
            .send(validShipping);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/cart is empty/i);
    });

    it('should return 400 when user has no cart', async () => {
        setupReadData({ carts: [] });
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', AUTH_HEADER)
            .send(validShipping);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/cart is empty/i);
    });

    it('should create an order and clear the cart on success', async () => {
        setupReadData();
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', AUTH_HEADER)
            .send(validShipping);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('order');
        expect(res.body.order.status).toBe('pending');
        expect(res.body.order.userId).toBe(1);
        // writeData called twice: once for orders, once for cleared cart
        expect(writeData).toHaveBeenCalledTimes(2);
    });

    it('should calculate correct total', async () => {
        setupReadData();
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', AUTH_HEADER)
            .send(validShipping);

        expect(res.statusCode).toBe(201);
        // Laptop 999.99 * 2 = 1999.98
        expect(res.body.order.total).toBe(1999.98);
    });
});

// ─── PUT /api/orders/:id/status ───────────────────────────────────────────────

describe('PUT /api/orders/:id/status', () => {
    it('should return 400 for invalid status value', async () => {
        setupReadData();
        const res = await request(app)
            .put('/api/orders/1/status')
            .send({ status: 'INVALID_STATUS' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid status/i);
    });

    it('should return 404 for unknown order id', async () => {
        setupReadData();
        const res = await request(app).put('/api/orders/999/status').send({ status: 'shipped' });

        expect(res.statusCode).toBe(404);
    });

    it('should update status successfully for valid order and status', async () => {
        setupReadData();
        const res = await request(app).put('/api/orders/1/status').send({ status: 'shipped' });

        expect(res.statusCode).toBe(200);
        expect(res.body.order.status).toBe('shipped');
        expect(writeData).toHaveBeenCalled();
    });

    it('should accept all valid status values', async () => {
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

        for (const status of validStatuses) {
            setupReadData();
            const res = await request(app).put('/api/orders/1/status').send({ status });
            expect(res.statusCode).toBe(200);
        }
    });
});
