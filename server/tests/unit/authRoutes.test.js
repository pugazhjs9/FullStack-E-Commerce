const request = require('supertest');

// Mock dataUtils before requiring the app so routes use mock data
jest.mock('../../src/utils/dataUtils');
const { readData, writeData, generateId } = require('../../src/utils/dataUtils');

const app = require('../../src/app');

// ─── Test Data ────────────────────────────────────────────────────────────────

const mockUsers = [
    {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
        createdAt: '2024-01-01T00:00:00.000Z'
    }
];

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        readData.mockReturnValue([...mockUsers]);
        writeData.mockReturnValue(true);
        generateId.mockReturnValue(2);
    });

    it('should return 400 when name is missing', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'bob@example.com', password: 'pass' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('should return 400 when email is missing', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Bob', password: 'pass' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/required/i);
    });

    it('should return 400 when password is missing', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Bob', email: 'bob@example.com' });

        expect(res.statusCode).toBe(400);
    });

    it('should return 400 when email is already registered', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Alice2', email: 'alice@example.com', password: 'pass' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/already registered/i);
    });

    it('should return 201 with user and token on valid registration', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Bob', email: 'bob@example.com', password: 'secret' });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).not.toHaveProperty('password');
        expect(res.body.user.name).toBe('Bob');
        expect(res.body.user.email).toBe('bob@example.com');
    });

    it('should call writeData to save the new user', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ name: 'Bob', email: 'bob@example.com', password: 'secret' });

        expect(writeData).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when readData throws', async () => {
        readData.mockImplementation(() => { throw new Error('disk error'); });

        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Bob', email: 'bob@example.com', password: 'secret' });

        expect(res.statusCode).toBe(500);
    });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        readData.mockReturnValue([...mockUsers]);
    });

    it('should return 400 when email is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ password: 'password123' });

        expect(res.statusCode).toBe(400);
    });

    it('should return 400 when password is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'alice@example.com' });

        expect(res.statusCode).toBe(400);
    });

    it('should return 401 for wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'alice@example.com', password: 'wrongpass' });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/invalid/i);
    });

    it('should return 401 for unknown email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'unknown@example.com', password: 'password123' });

        expect(res.statusCode).toBe(401);
    });

    it('should return 200 with user (no password) and token on success', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'alice@example.com', password: 'password123' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).not.toHaveProperty('password');
        expect(res.body.user.name).toBe('Alice');
    });

    it('should be case-insensitive for email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'ALICE@EXAMPLE.COM', password: 'password123' });

        expect(res.statusCode).toBe(200);
    });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        readData.mockReturnValue([...mockUsers]);
    });

    it('should return 401 when no Authorization header provided', async () => {
        const res = await request(app).get('/api/auth/me');

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/no token/i);
    });

    it('should return 401 when token format is malformed', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer badtoken');

        expect(res.statusCode).toBe(401);
    });

    it('should return 401 when user ID from token does not exist', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer token_999_12345');

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/user not found/i);
    });

    it('should return 200 with user data (no password) for valid token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer token_1_12345');

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Alice');
        expect(res.body).not.toHaveProperty('password');
    });
});
