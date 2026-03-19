const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../src/app');

/**
 * Integration test specifically testing the end-to-end flow from
 * building a multi-item cart to placing an order and verifying
 * the order payload and cart clearance.
 */

const DATA_DIR = path.join(__dirname, '../../src/data');

const SAMPLE_PRODUCTS = [
    { id: 1, name: 'Laptop', price: 1000, category: 'Tech' },
    { id: 2, name: 'Mouse', price: 50, category: 'Tech' },
];

let originalUsers, originalCarts, originalProducts, originalOrders;

beforeAll(() => {
    try {
        originalUsers = fs.readFileSync(path.join(DATA_DIR, 'users.json'), 'utf8');
    } catch {
        originalUsers = '[]';
    }
    try {
        originalCarts = fs.readFileSync(path.join(DATA_DIR, 'carts.json'), 'utf8');
    } catch {
        originalCarts = '[]';
    }
    try {
        originalProducts = fs.readFileSync(path.join(DATA_DIR, 'products.json'), 'utf8');
    } catch {
        originalProducts = '[]';
    }
    try {
        originalOrders = fs.readFileSync(path.join(DATA_DIR, 'orders.json'), 'utf8');
    } catch {
        originalOrders = '[]';
    }
});

beforeEach(() => {
    fs.writeFileSync(path.join(DATA_DIR, 'users.json'), '[]', 'utf8');
    fs.writeFileSync(path.join(DATA_DIR, 'carts.json'), '[]', 'utf8');
    fs.writeFileSync(path.join(DATA_DIR, 'orders.json'), '[]', 'utf8');
    fs.writeFileSync(
        path.join(DATA_DIR, 'products.json'),
        JSON.stringify(SAMPLE_PRODUCTS, null, 2),
        'utf8'
    );
});

afterAll(() => {
    fs.writeFileSync(path.join(DATA_DIR, 'users.json'), originalUsers, 'utf8');
    fs.writeFileSync(path.join(DATA_DIR, 'carts.json'), originalCarts, 'utf8');
    fs.writeFileSync(path.join(DATA_DIR, 'products.json'), originalProducts, 'utf8');
    fs.writeFileSync(path.join(DATA_DIR, 'orders.json'), originalOrders, 'utf8');
});

describe('Cart to Order Flow (integration)', () => {
    it('should create a multi-item cart and convert it to an order successfully', async () => {
        // 1. Register a user
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'CartOrder Test',
                email: `test_${Date.now()}@test.com`,
                password: 'password123',
            });

        const authHeader = `Bearer ${regRes.body.token}`;

        // 2. Add two different items to cart
        await request(app)
            .post('/api/cart')
            .set('Authorization', authHeader)
            .send({ productId: 1, quantity: 1 });
        await request(app)
            .post('/api/cart')
            .set('Authorization', authHeader)
            .send({ productId: 2, quantity: 2 });

        // 3. Verify cart has items and correct subtotal (1000*1 + 50*2 = 1100)
        const cartRes = await request(app).get('/api/cart').set('Authorization', authHeader);
        expect(cartRes.body.items).toHaveLength(2);
        expect(cartRes.body.subtotal).toBe(1100);

        // 4. Place an order
        const shippingAddress = {
            name: 'Test',
            address: '123 St',
            city: 'Testville',
            zip: '12345',
        };
        const orderRes = await request(app)
            .post('/api/orders')
            .set('Authorization', authHeader)
            .send({ shippingAddress });

        expect(orderRes.statusCode).toBe(201);
        expect(orderRes.body.order.status).toBe('pending');
        expect(orderRes.body.order.items).toHaveLength(2);
        expect(orderRes.body.order.total).toBe(1100);

        // 5. Verify the cart is emptied after order is placed
        const finalCartRes = await request(app).get('/api/cart').set('Authorization', authHeader);
        expect(finalCartRes.body.items).toHaveLength(0);
        expect(finalCartRes.body.subtotal).toBe(0);
    });
});
