const express = require('express');
const router = express.Router();
const { readData, writeData, generateId } = require('../utils/dataUtils');

const USERS_FILE = 'users.json';

// POST /api/auth/register - Register new user
router.post('/register', (req, res) => {
    try {
        const users = readData(USERS_FILE);
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // Check if email already exists
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const newUser = {
            id: generateId(users),
            name,
            email: email.toLowerCase(),
            password, // In production, this should be hashed
            createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        writeData(USERS_FILE, users);

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({
            message: 'Registration successful',
            user: userWithoutPassword,
            token: `token_${newUser.id}_${Date.now()}`, // Simple token for demo
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login - Login user
router.post('/login', (req, res) => {
    try {
        const users = readData(USERS_FILE);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = users.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            message: 'Login successful',
            user: userWithoutPassword,
            token: `token_${user.id}_${Date.now()}`, // Simple token for demo
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/me - Get current user (validate token)
router.get('/me', (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        // Extract user ID from simple token format: token_userId_timestamp
        const tokenParts = token.split('_');

        if (tokenParts.length < 2) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const userId = parseInt(tokenParts[1]);
        const users = readData(USERS_FILE);
        const user = users.find(u => u.id === userId);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: 'Failed to validate token' });
    }
});

module.exports = router;
