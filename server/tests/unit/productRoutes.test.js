const request = require('supertest');

jest.mock('../../src/utils/dataUtils');
const { readData, writeData, generateId } = require('../../src/utils/dataUtils');

const app = require('../../src/app');

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockProducts = [
    {
        id: 1,
        name: 'Laptop',
        description: 'A great laptop',
        price: 999.99,
        category: 'Electronics',
        stock: 10,
        rating: 4.5,
        reviews: 100,
        featured: true,
    },
    {
        id: 2,
        name: 'T-Shirt',
        description: 'Comfortable shirt',
        price: 19.99,
        category: 'Clothing',
        stock: 50,
        rating: 3.8,
        reviews: 30,
        featured: false,
    },
    {
        id: 3,
        name: 'Headphones',
        description: 'Noise cancelling',
        price: 199.99,
        category: 'Electronics',
        stock: 0,
        rating: 4.9,
        reviews: 500,
        featured: false,
    },
];

beforeEach(() => {
    jest.clearAllMocks();
    readData.mockReturnValue([...mockProducts]);
    writeData.mockReturnValue(true);
    generateId.mockReturnValue(4);
});

// ─── GET /api/products ────────────────────────────────────────────────────────

describe('GET /api/products', () => {
    it('should return all products', async () => {
        const res = await request(app).get('/api/products');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(3);
    });

    it('should filter by category', async () => {
        const res = await request(app).get('/api/products?category=Electronics');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(2);
        res.body.forEach(p => expect(p.category).toBe('Electronics'));
    });

    it('should filter by search term matching name', async () => {
        const res = await request(app).get('/api/products?search=laptop');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].name).toBe('Laptop');
    });

    it('should filter by search term matching description', async () => {
        const res = await request(app).get('/api/products?search=noise');

        expect(res.statusCode).toBe(200);
        expect(res.body[0].name).toBe('Headphones');
    });

    it('should filter featured products only', async () => {
        const res = await request(app).get('/api/products?featured=true');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].name).toBe('Laptop');
    });

    it('should sort by price ascending (price-low)', async () => {
        const res = await request(app).get('/api/products?sort=price-low');

        expect(res.statusCode).toBe(200);
        const prices = res.body.map(p => p.price);
        expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    it('should sort by price descending (price-high)', async () => {
        const res = await request(app).get('/api/products?sort=price-high');

        expect(res.statusCode).toBe(200);
        const prices = res.body.map(p => p.price);
        expect(prices).toEqual([...prices].sort((a, b) => b - a));
    });

    it('should sort by rating descending', async () => {
        const res = await request(app).get('/api/products?sort=rating');

        expect(res.statusCode).toBe(200);
        const ratings = res.body.map(p => p.rating);
        expect(ratings[0]).toBe(4.9); // Headphones
    });

    it('should sort by name alphabetically', async () => {
        const res = await request(app).get('/api/products?sort=name');

        expect(res.statusCode).toBe(200);
        const names = res.body.map(p => p.name);
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });

    it('should return 500 when readData throws', async () => {
        readData.mockImplementation(() => {
            throw new Error('IO error');
        });
        const res = await request(app).get('/api/products');
        expect(res.statusCode).toBe(500);
    });
});

// ─── GET /api/products/categories ─────────────────────────────────────────────

describe('GET /api/products/categories', () => {
    it('should return unique categories', async () => {
        const res = await request(app).get('/api/products/categories');

        expect(res.statusCode).toBe(200);
        expect(res.body).toContain('Electronics');
        expect(res.body).toContain('Clothing');
        // Should be unique (Electronics appears twice in mock data)
        const electronicsCount = res.body.filter(c => c === 'Electronics').length;
        expect(electronicsCount).toBe(1);
    });
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────

describe('GET /api/products/:id', () => {
    it('should return the product for a valid id', async () => {
        const res = await request(app).get('/api/products/1');

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Laptop');
    });

    it('should return 404 for unknown id', async () => {
        const res = await request(app).get('/api/products/999');

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });
});

// ─── POST /api/products ───────────────────────────────────────────────────────

describe('POST /api/products', () => {
    it('should return 400 when name is missing', async () => {
        const res = await request(app).post('/api/products').send({ price: 10, category: 'Test' });
        expect(res.statusCode).toBe(400);
    });

    it('should return 400 when price is missing', async () => {
        const res = await request(app)
            .post('/api/products')
            .send({ name: 'Test', category: 'Test' });
        expect(res.statusCode).toBe(400);
    });

    it('should return 400 when category is missing', async () => {
        const res = await request(app).post('/api/products').send({ name: 'Test', price: 10 });
        expect(res.statusCode).toBe(400);
    });

    it('should return 201 with new product on valid payload', async () => {
        const res = await request(app)
            .post('/api/products')
            .send({ name: 'Widget', price: 9.99, category: 'Misc', stock: 100 });

        expect(res.statusCode).toBe(201);
        expect(res.body.id).toBe(4);
        expect(res.body.name).toBe('Widget');
        expect(res.body.price).toBe(9.99);
        expect(writeData).toHaveBeenCalled();
    });
});

// ─── PUT /api/products/:id ────────────────────────────────────────────────────

describe('PUT /api/products/:id', () => {
    it('should return 404 for unknown id', async () => {
        const res = await request(app).put('/api/products/999').send({ name: 'Updated' });
        expect(res.statusCode).toBe(404);
    });

    it('should return 200 with updated product', async () => {
        const res = await request(app)
            .put('/api/products/1')
            .send({ name: 'Updated Laptop', price: 1099.99 });

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Updated Laptop');
        expect(res.body.id).toBe(1); // ID preserved
        expect(writeData).toHaveBeenCalled();
    });
});

// ─── DELETE /api/products/:id ──────────────────────────────────────────────────

describe('DELETE /api/products/:id', () => {
    it('should return 404 for unknown id', async () => {
        const res = await request(app).delete('/api/products/999');
        expect(res.statusCode).toBe(404);
    });

    it('should return 200 and delete the product', async () => {
        const res = await request(app).delete('/api/products/1');

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);
        expect(writeData).toHaveBeenCalled();
    });
});
