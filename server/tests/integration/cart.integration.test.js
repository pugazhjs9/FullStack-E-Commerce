const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../src/app');

/**
 * Integration tests for Cart routes.
 * Uses the real app and real data files.
 * Restores user/cart/product data between tests.
 */

const DATA_DIR = path.join(__dirname, '../../src/data');

const SAMPLE_PRODUCTS = [
    {
        id: 1,
        name: 'Laptop',
        description: 'A great laptop',
        price: 999.99,
        category: 'Electronics',
        image: 'https://example.com/img.jpg',
        rating: 4.5,
        reviews: 100,
        stock: 10,
        featured: true,
    },
    {
        id: 2,
        name: 'T-Shirt',
        description: 'Comfortable shirt',
        price: 19.99,
        category: 'Clothing',
        image: 'https://example.com/img2.jpg',
        rating: 3.8,
        reviews: 30,
        stock: 50,
        featured: false,
    },
];

// ─── Backup & Restore ─────────────────────────────────────────────────────────

let originalUsers, originalCarts, originalProducts;

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
});

beforeEach(() => {
    fs.writeFileSync(path.join(DATA_DIR, 'users.json'), '[]', 'utf8');
    fs.writeFileSync(path.join(DATA_DIR, 'carts.json'), '[]', 'utf8');
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
});

// ─── Helper ───────────────────────────────────────────────────────────────────

async function registerAndLogin() {
    const regRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'CartUser', email: `cart_${Date.now()}@test.com`, password: 'pass123' });
    return `Bearer ${regRes.body.token}`;
}

// ─── GET /api/cart ────────────────────────────────────────────────────────────

describe('GET /api/cart (integration)', () => {
    it('should return 401 when not authenticated', async () => {
        const res = await request(app).get('/api/cart');
        expect(res.statusCode).toBe(401);
    });

    it('should return empty cart for a new user', async () => {
        const authHeader = await registerAndLogin();
        const res = await request(app).get('/api/cart').set('Authorization', authHeader);

        expect(res.statusCode).toBe(200);
        expect(res.body.items).toHaveLength(0);
        expect(res.body.itemCount).toBe(0);
        expect(res.body.subtotal).toBe(0);
    });
});

// ─── POST /api/cart ───────────────────────────────────────────────────────────

describe('POST /api/cart (integration)', () => {
    it('should add an item to the cart', async () => {
        const authHeader = await registerAndLogin();

        const res = await request(app)
            .post('/api/cart')
            .set('Authorization', authHeader)
            .send({ productId: 1, quantity: 2 });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/added/i);
    });

    it('should increment quantity when adding existing item', async () => {
        const authHeader = await registerAndLogin();

        // Add once
        await request(app)
            .post('/api/cart')
            .set('Authorization', authHeader)
            .send({ productId: 1, quantity: 1 });

        // Add again
        await request(app)
            .post('/api/cart')
            .set('Authorization', authHeader)
            .send({ productId: 1, quantity: 2 });

        const cartRes = await request(app).get('/api/cart').set('Authorization', authHeader);

        const item = cartRes.body.items.find(i => i.productId === 1);
        expect(item.quantity).toBe(3);
    });

    it('should return 404 for non-existent product', async () => {
        const authHeader = await registerAndLogin();

        const res = await request(app)
            .post('/api/cart')
            .set('Authorization', authHeader)
            .send({ productId: 9999 });

        expect(res.statusCode).toBe(404);
    });
});

// ─── PUT /api/cart/:productId ─────────────────────────────────────────────────

describe('PUT /api/cart/:productId (integration)', () => {
    it('should update item quantity', async () => {
        const authHeader = await registerAndLogin();

        // Add item first
        await request(app)
            .post('/api/cart')
            .set('Authorization', authHeader)
            .send({ productId: 1, quantity: 1 });

        // Update quantity
        const res = await request(app)
            .put('/api/cart/1')
            .set('Authorization', authHeader)
            .send({ quantity: 5 });

        expect(res.statusCode).toBe(200);

        const cartRes = await request(app).get('/api/cart').set('Authorization', authHeader);
        expect(cartRes.body.items[0].quantity).toBe(5);
    });

    it('should remove item when quantity set to 0', async () => {
        const authHeader = await registerAndLogin();

        await request(app)
            .post('/api/cart')
            .set('Authorization', authHeader)
            .send({ productId: 1, quantity: 2 });

        await request(app)
            .put('/api/cart/1')
            .set('Authorization', authHeader)
            .send({ quantity: 0 });

        const cartRes = await request(app).get('/api/cart').set('Authorization', authHeader);
        expect(cartRes.body.items).toHaveLength(0);
    });
});

// ─── DELETE /api/cart/:productId ─────────────────────────────────────────────

describe('DELETE /api/cart/:productId (integration)', () => {
    it('should remove an item from the cart', async () => {
        const authHeader = await registerAndLogin();

        await request(app)
            .post('/api/cart')
            .set('Authorization', authHeader)
            .send({ productId: 1, quantity: 1 });

        await request(app)
            .post('/api/cart')
            .set('Authorization', authHeader)
            .send({ productId: 2, quantity: 1 });

        const removeRes = await request(app).delete('/api/cart/1').set('Authorization', authHeader);

        expect(removeRes.statusCode).toBe(200);

        const cartRes = await request(app).get('/api/cart').set('Authorization', authHeader);

        expect(cartRes.body.items).toHaveLength(1);
        expect(cartRes.body.items[0].productId).toBe(2);
    });
});

// ─── DELETE /api/cart (clear) ─────────────────────────────────────────────────

describe('DELETE /api/cart (clear, integration)', () => {
    it('should clear all items from cart', async () => {
        const authHeader = await registerAndLogin();

        // Add two items
        await request(app)
            .post('/api/cart')
            .set('Authorization', authHeader)
            .send({ productId: 1, quantity: 1 });

        await request(app)
            .post('/api/cart')
            .set('Authorization', authHeader)
            .send({ productId: 2, quantity: 2 });

        const clearRes = await request(app).delete('/api/cart').set('Authorization', authHeader);

        expect(clearRes.statusCode).toBe(200);

        const cartRes = await request(app).get('/api/cart').set('Authorization', authHeader);

        expect(cartRes.body.items).toHaveLength(0);
        expect(cartRes.body.subtotal).toBe(0);
    });
});

// ─── Full Cart Workflow ───────────────────────────────────────────────────────

describe('Full cart workflow (integration)', () => {
    it('should add → update → remove items, showing correct subtotals', async () => {
        const authHeader = await registerAndLogin();

        // Add Laptop x2
        await request(app)
            .post('/api/cart')
            .set('Authorization', authHeader)
            .send({ productId: 1, quantity: 2 });

        // Check subtotal: 2 * 999.99 = 1999.98
        let cartRes = await request(app).get('/api/cart').set('Authorization', authHeader);
        expect(cartRes.body.subtotal).toBeCloseTo(1999.98, 2);

        // Update to 1
        await request(app)
            .put('/api/cart/1')
            .set('Authorization', authHeader)
            .send({ quantity: 1 });

        cartRes = await request(app).get('/api/cart').set('Authorization', authHeader);
        expect(cartRes.body.subtotal).toBeCloseTo(999.99, 2);

        // Remove Laptop
        await request(app).delete('/api/cart/1').set('Authorization', authHeader);

        cartRes = await request(app).get('/api/cart').set('Authorization', authHeader);
        expect(cartRes.body.items).toHaveLength(0);
        expect(cartRes.body.subtotal).toBe(0);
    });
});
