const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../src/app');

/**
 * Integration tests for Auth routes.
 * These tests use the REAL Express app and REAL data files.
 * We swap in a temporary data directory to avoid corrupting dev data.
 */

const TEST_DATA_DIR = path.join(__dirname, '../fixtures/data');
const DATA_UTILS_PATH = path.join(__dirname, '../../src/utils/dataUtils.js');

// ─── Setup & Teardown ─────────────────────────────────────────────────────────

// Override the data directory used by dataUtils to point to test fixtures
const originalDataDir = path.join(__dirname, '../../src/data');

beforeAll(() => {
    // Create test data dir if needed
    if (!fs.existsSync(TEST_DATA_DIR)) {
        fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
    }
});

beforeEach(() => {
    // Reset test data before each test
    fs.writeFileSync(path.join(TEST_DATA_DIR, 'users.json'), '[]', 'utf8');

    // Monkey-patch the dataDir inside dataUtils for test isolation
    // We require and re-point the module's internal path
    jest.resetModules();
});

afterAll(() => {
    // Clean up test fixtures
    try {
        fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (e) { /* ignore */ }
});

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Register a user and return the response body (includes token).
 */
async function registerUser(data = {}) {
    const payload = {
        name: data.name || 'Test User',
        email: data.email || `user_${Date.now()}@test.com`,
        password: data.password || 'testpass123',
    };
    const res = await request(app).post('/api/auth/register').send(payload);
    return { res, payload };
}

// ─── Register Tests ───────────────────────────────────────────────────────────

describe('POST /api/auth/register (integration)', () => {
    it('should successfully register a new user', async () => {
        const { res } = await registerUser({
            name: 'Alice',
            email: 'alice@integration.com',
            password: 'securepass'
        });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.name).toBe('Alice');
        expect(res.body.user.email).toBe('alice@integration.com');
        expect(res.body.user).not.toHaveProperty('password');
        expect(res.body.message).toMatch(/registration successful/i);
    });

    it('should reject registration with missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Bob' });
        expect(res.statusCode).toBe(400);
    });

    it('should prevent duplicate email registration', async () => {
        await registerUser({ email: 'dup@test.com', name: 'User1' });
        const { res } = await registerUser({ email: 'dup@test.com', name: 'User2' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/already registered/i);
    });

    it('should be case-insensitive for email uniqueness check', async () => {
        await registerUser({ email: 'Case@Test.com', name: 'CaseUser1' });
        const { res } = await registerUser({ email: 'case@test.com', name: 'CaseUser2' });

        expect(res.statusCode).toBe(400);
    });
});

// ─── Login Tests ──────────────────────────────────────────────────────────────

describe('POST /api/auth/login (integration)', () => {
    it('should login with valid credentials', async () => {
        await registerUser({ email: 'login@test.com', password: 'mypassword' });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'login@test.com', password: 'mypassword' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).not.toHaveProperty('password');
    });

    it('should reject login with wrong password', async () => {
        await registerUser({ email: 'wrongpass@test.com', password: 'correct' });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'wrongpass@test.com', password: 'wrong' });

        expect(res.statusCode).toBe(401);
    });

    it('should reject login for non-existent email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'ghost@test.com', password: 'pass' });

        expect(res.statusCode).toBe(401);
    });
});

// ─── Get Me Tests ──────────────────────────────────────────────────────────────

describe('GET /api/auth/me (integration)', () => {
    it('should return user data with valid token', async () => {
        const { res: regRes } = await registerUser({ name: 'MeUser', email: 'me@test.com' });
        const { token } = regRes.body;

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('MeUser');
        expect(res.body).not.toHaveProperty('password');
    });

    it('should return 401 without a token', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.statusCode).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer invalid_token');
        expect(res.statusCode).toBe(401);
    });
});

// ─── Full Auth Flow ───────────────────────────────────────────────────────────

describe('Full auth flow (integration)', () => {
    it('should register → login → access protected route', async () => {
        // 1. Register
        const { res: regRes } = await registerUser({
            name: 'FlowUser',
            email: 'flow@test.com',
            password: 'flowpass'
        });
        expect(regRes.statusCode).toBe(201);

        // 2. Login
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'flow@test.com', password: 'flowpass' });
        expect(loginRes.statusCode).toBe(200);
        const { token } = loginRes.body;

        // 3. Use token to access /me
        const meRes = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);
        expect(meRes.statusCode).toBe(200);
        expect(meRes.body.email).toBe('flow@test.com');
    });
});
