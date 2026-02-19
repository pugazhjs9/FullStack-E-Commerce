const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../src/app');

/**
 * Integration tests for Order routes.
 * Tests the full checkout flow: register → login → add to cart → place order.
 */

const DATA_DIR = path.join(__dirname, '../../src/data');

const SAMPLE_PRODUCTS = [
    { id: 1, name: 'Laptop', description: 'A great laptop', price: 999.99, category: 'Electronics', image: 'https://example.com/img.jpg', rating: 4.5, reviews: 100, stock: 10, featured: true },
];

let originalUsers, originalCarts, originalProducts, originalOrders;

beforeAll(() => {
    try { originalUsers = fs.readFileSync(path.join(DATA_DIR, 'users.json'), 'utf8'); } catch { originalUsers = '[]'; }
    try { originalCarts = fs.readFileSync(path.join(DATA_DIR, 'carts.json'), 'utf8'); } catch { originalCarts = '[]'; }
    try { originalProducts = fs.readFileSync(path.join(DATA_DIR, 'products.json'), 'utf8'); } catch { originalProducts = '[]'; }
    try { originalOrders = fs.readFileSync(path.join(DATA_DIR, 'orders.json'), 'utf8'); } catch { originalOrders = '[]'; }
});

beforeEach(() => {
    fs.writeFileSync(path.join(DATA_DIR, 'users.json'), '[]', 'utf8');
    fs.writeFileSync(path.join(DATA_DIR, 'carts.json'), '[]', 'utf8');
    fs.writeFileSync(path.join(DATA_DIR, 'orders.json'), '[]', 'utf8');
    fs.writeFileSync(path.join(DATA_DIR, 'products.json'), JSON.stringify(SAMPLE_PRODUCTS, null, 2), 'utf8');
});

afterAll(() => {
    fs.writeFileSync(path.join(DATA_DIR, 'users.json'), originalUsers, 'utf8');
    fs.writeFileSync(path.join(DATA_DIR, 'carts.json'), originalCarts, 'utf8');
    fs.writeFileSync(path.join(DATA_DIR, 'products.json'), originalProducts, 'utf8');
    fs.writeFileSync(path.join(DATA_DIR, 'orders.json'), originalOrders, 'utf8');
});

// ─── Helper ───────────────────────────────────────────────────────────────────

async function setupUserWithCart() {
    const regRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'OrderUser', email: `order_${Date.now()}@test.com`, password: 'pass123' });

    const authHeader = `Bearer ${regRes.body.token}`;

    await request(app)
        .post('/api/cart')
        .set('Authorization', authHeader)
        .send({ productId: 1, quantity: 2 });

    return { authHeader, userId: regRes.body.user.id };
}

const validShipping = {
    shippingAddress: {
        name: 'Test User',
        address: '123 Test Street',
        city: 'Test City',
        zip: '12345'
    }
};

// ─── GET /api/orders ──────────────────────────────────────────────────────────

describe('GET /api/orders (integration)', () => {
    it('should return 401 without token', async () => {
        const res = await request(app).get('/api/orders');
        expect(res.statusCode).toBe(401);
    });

    it('should return empty order list for new user', async () => {
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Fresh', email: `fresh_${Date.now()}@test.com`, password: 'pass' });

        const res = await request(app)
            .get('/api/orders')
            .set('Authorization', `Bearer ${regRes.body.token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(0);
    });
});

// ─── POST /api/orders (create) ────────────────────────────────────────────────

describe('POST /api/orders (integration)', () => {
    it('should return 401 without auth', async () => {
        const res = await request(app).post('/api/orders').send(validShipping);
        expect(res.statusCode).toBe(401);
    });

    it('should return 400 when shipping address is incomplete', async () => {
        const { authHeader } = await setupUserWithCart();

        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', authHeader)
            .send({ shippingAddress: { name: 'Test' } }); // missing fields

        expect(res.statusCode).toBe(400);
    });

    it('should return 400 when cart is empty', async () => {
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({ name: 'EmptyCart', email: `empty_${Date.now()}@test.com`, password: 'pass' });

        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${regRes.body.token}`)
            .send(validShipping);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/cart is empty/i);
    });

    it('should create an order from cart items', async () => {
        const { authHeader } = await setupUserWithCart();

        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', authHeader)
            .send(validShipping);

        expect(res.statusCode).toBe(201);
        expect(res.body.order).toBeDefined();
        expect(res.body.order.status).toBe('pending');
        expect(res.body.order.items).toHaveLength(1);
        expect(res.body.order.items[0].name).toBe('Laptop');
        expect(res.body.order.total).toBeCloseTo(1999.98, 2); // 2 * 999.99
    });

    it('should clear the cart after order creation', async () => {
        const { authHeader } = await setupUserWithCart();

        await request(app)
            .post('/api/orders')
            .set('Authorization', authHeader)
            .send(validShipping);

        const cartRes = await request(app)
            .get('/api/cart')
            .set('Authorization', authHeader);

        expect(cartRes.body.items).toHaveLength(0);
    });
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────

describe('GET /api/orders/:id (integration)', () => {
    it('should return a specific order', async () => {
        const { authHeader } = await setupUserWithCart();

        const createRes = await request(app)
            .post('/api/orders')
            .set('Authorization', authHeader)
            .send(validShipping);

        const { id } = createRes.body.order;

        const res = await request(app)
            .get(`/api/orders/${id}`)
            .set('Authorization', authHeader);

        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(id);
    });

    it('should not allow user to view another user\'s order', async () => {
        // Create order as user 1
        const { authHeader: auth1 } = await setupUserWithCart();
        const createRes = await request(app)
            .post('/api/orders')
            .set('Authorization', auth1)
            .send(validShipping);
        const { id } = createRes.body.order;

        // Login as user 2
        const reg2 = await request(app)
            .post('/api/auth/register')
            .send({ name: 'User2', email: `user2_${Date.now()}@test.com`, password: 'pass' });
        const auth2 = `Bearer ${reg2.body.token}`;

        const res = await request(app)
            .get(`/api/orders/${id}`)
            .set('Authorization', auth2);

        expect(res.statusCode).toBe(404);
    });
});

// ─── PUT /api/orders/:id/status ───────────────────────────────────────────────

describe('PUT /api/orders/:id/status (integration)', () => {
    it('should update order status', async () => {
        const { authHeader } = await setupUserWithCart();
        const createRes = await request(app)
            .post('/api/orders')
            .set('Authorization', authHeader)
            .send(validShipping);
        const { id } = createRes.body.order;

        const res = await request(app)
            .put(`/api/orders/${id}/status`)
            .send({ status: 'shipped' });

        expect(res.statusCode).toBe(200);
        expect(res.body.order.status).toBe('shipped');
    });
});

// ─── Full Order Flow ──────────────────────────────────────────────────────────

describe('Full order flow (integration)', () => {
    it('should register → add to cart → checkout → view order', async () => {
        // 1. Register
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({ name: 'FlowUser', email: `flow_${Date.now()}@test.com`, password: 'pass123' });
        const authHeader = `Bearer ${regRes.body.token}`;

        // 2. Add item to cart
        await request(app)
            .post('/api/cart')
            .set('Authorization', authHeader)
            .send({ productId: 1, quantity: 1 });

        // 3. Place order
        const orderRes = await request(app)
            .post('/api/orders')
            .set('Authorization', authHeader)
            .send(validShipping);

        expect(orderRes.statusCode).toBe(201);
        const { id: orderId } = orderRes.body.order;

        // 4. Get orders list – should show this order
        const listRes = await request(app)
            .get('/api/orders')
            .set('Authorization', authHeader);
        expect(listRes.body).toHaveLength(1);
        expect(listRes.body[0].id).toBe(orderId);

        // 5. Get single order
        const singleRes = await request(app)
            .get(`/api/orders/${orderId}`)
            .set('Authorization', authHeader);
        expect(singleRes.body.status).toBe('pending');
        expect(singleRes.body.items[0].name).toBe('Laptop');

        // 6. Cart should be empty
        const cartRes = await request(app).get('/api/cart').set('Authorization', authHeader);
        expect(cartRes.body.items).toHaveLength(0);
    });
});
