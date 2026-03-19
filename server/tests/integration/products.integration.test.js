const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../src/app');

/**
 * Integration tests for Product routes.
 * Uses the real app with real data files.
 * The products.json data file is reset before each test.
 */

const DATA_DIR = path.join(__dirname, '../../src/data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

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
        description: 'Comfortable cotton shirt',
        price: 19.99,
        category: 'Clothing',
        image: 'https://example.com/img2.jpg',
        rating: 3.8,
        reviews: 30,
        stock: 50,
        featured: false,
    },
    {
        id: 3,
        name: 'Headphones',
        description: 'Noise cancelling',
        price: 199.99,
        category: 'Electronics',
        image: 'https://example.com/img3.jpg',
        rating: 4.9,
        reviews: 500,
        stock: 0,
        featured: false,
    },
];

// ─── Backup & Restore ─────────────────────────────────────────────────────────

let originalProducts;

beforeAll(() => {
    // Backup original data
    try {
        originalProducts = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    } catch (e) {
        originalProducts = '[]';
    }
});

beforeEach(() => {
    // Reset to known sample data
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(SAMPLE_PRODUCTS, null, 2), 'utf8');
});

afterAll(() => {
    // Restore original data
    fs.writeFileSync(PRODUCTS_FILE, originalProducts, 'utf8');
});

// ─── GET /api/products ────────────────────────────────────────────────────────

describe('GET /api/products (integration)', () => {
    it('should return all products', async () => {
        const res = await request(app).get('/api/products');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(3);
    });

    it('should filter by Electronics category', async () => {
        const res = await request(app).get('/api/products?category=Electronics');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(2);
        res.body.forEach(p => expect(p.category).toBe('Electronics'));
    });

    it('should filter by search term', async () => {
        const res = await request(app).get('/api/products?search=noise');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].name).toBe('Headphones');
    });

    it('should return only featured products', async () => {
        const res = await request(app).get('/api/products?featured=true');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].featured).toBe(true);
    });

    it('should sort products by price ascending', async () => {
        const res = await request(app).get('/api/products?sort=price-low');

        expect(res.statusCode).toBe(200);
        const prices = res.body.map(p => p.price);
        expect(prices[0]).toBeLessThanOrEqual(prices[1]);
        expect(prices[1]).toBeLessThanOrEqual(prices[2]);
    });
});

// ─── GET /api/products/categories ─────────────────────────────────────────────

describe('GET /api/products/categories (integration)', () => {
    it('should return unique categories', async () => {
        const res = await request(app).get('/api/products/categories');

        expect(res.statusCode).toBe(200);
        expect(res.body).toContain('Electronics');
        expect(res.body).toContain('Clothing');
        // Unique – Electronics appears twice in sample data but should be once
        expect(res.body.filter(c => c === 'Electronics').length).toBe(1);
    });
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────

describe('GET /api/products/:id (integration)', () => {
    it('should return a specific product by id', async () => {
        const res = await request(app).get('/api/products/1');

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Laptop');
        expect(res.body.id).toBe(1);
    });

    it('should return 404 for non-existent id', async () => {
        const res = await request(app).get('/api/products/9999');

        expect(res.statusCode).toBe(404);
    });
});

// ─── POST /api/products ───────────────────────────────────────────────────────

describe('POST /api/products (integration)', () => {
    it('should create a new product', async () => {
        const newProduct = {
            name: 'Widget',
            description: 'A useful widget',
            price: 29.99,
            category: 'Accessories',
            stock: 100,
        };

        const res = await request(app).post('/api/products').send(newProduct);

        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe('Widget');
        expect(res.body.id).toBeDefined();

        // Verify product was persisted
        const getAllRes = await request(app).get('/api/products');
        expect(getAllRes.body).toHaveLength(4);
    });

    it('should return 400 for missing required fields', async () => {
        const res = await request(app)
            .post('/api/products')
            .send({ description: 'No name or price' });

        expect(res.statusCode).toBe(400);
    });
});

// ─── PUT /api/products/:id ────────────────────────────────────────────────────

describe('PUT /api/products/:id (integration)', () => {
    it('should update a product', async () => {
        const res = await request(app)
            .put('/api/products/1')
            .send({ name: 'Gaming Laptop', price: 1499.99 });

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Gaming Laptop');
        expect(res.body.price).toBe(1499.99);
        expect(res.body.id).toBe(1); // ID preserved

        // Verify persistence
        const getRes = await request(app).get('/api/products/1');
        expect(getRes.body.name).toBe('Gaming Laptop');
    });

    it('should return 404 for non-existent product', async () => {
        const res = await request(app).put('/api/products/9999').send({ name: 'Ghost' });
        expect(res.statusCode).toBe(404);
    });
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────

describe('DELETE /api/products/:id (integration)', () => {
    it('should delete a product', async () => {
        const res = await request(app).delete('/api/products/1');

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);

        // Verify it's gone
        const getRes = await request(app).get('/api/products/1');
        expect(getRes.statusCode).toBe(404);

        // Verify other products remain
        const allRes = await request(app).get('/api/products');
        expect(allRes.body).toHaveLength(2);
    });

    it('should return 404 for non-existent product', async () => {
        const res = await request(app).delete('/api/products/9999');
        expect(res.statusCode).toBe(404);
    });
});

// ─── Full CRUD Cycle ──────────────────────────────────────────────────────────

describe('Full product CRUD cycle (integration)', () => {
    it('should create, read, update, and delete a product', async () => {
        // Create
        const createRes = await request(app)
            .post('/api/products')
            .send({ name: 'Gadget', price: 49.99, category: 'Tech' });
        expect(createRes.statusCode).toBe(201);
        const { id } = createRes.body;

        // Read
        const readRes = await request(app).get(`/api/products/${id}`);
        expect(readRes.body.name).toBe('Gadget');

        // Update
        const updateRes = await request(app).put(`/api/products/${id}`).send({ price: 39.99 });
        expect(updateRes.body.price).toBe(39.99);

        // Delete
        const deleteRes = await request(app).delete(`/api/products/${id}`);
        expect(deleteRes.statusCode).toBe(200);

        // Verify gone
        const finalRes = await request(app).get(`/api/products/${id}`);
        expect(finalRes.statusCode).toBe(404);
    });
});
