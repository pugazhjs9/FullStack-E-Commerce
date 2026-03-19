const express = require('express');
const cors = require('cors');

// Import routes
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(
    cors({
        origin: true, // Automatically allow any origin (Fixes dynamic AWS IPs)
        credentials: true, // Allow Authorization headers / cookies
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);
app.use(express.json());

// Health Check Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'ShopSmart Backend is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Root Route
app.get('/', (req, res) => {
    res.json({
        name: 'ShopSmart API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            products: '/api/products',
            auth: '/api/auth',
            cart: '/api/cart',
            orders: '/api/orders',
        },
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
