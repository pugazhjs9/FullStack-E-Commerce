const express = require('express');
const router = express.Router();
const { readData, writeData, generateId } = require('../utils/dataUtils');

const ORDERS_FILE = 'orders.json';
const CARTS_FILE = 'carts.json';
const PRODUCTS_FILE = 'products.json';

// Helper to get user ID from token
const getUserIdFromToken = req => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    const tokenParts = token.split('_');
    return tokenParts.length >= 2 ? parseInt(tokenParts[1]) : null;
};

// GET /api/orders - Get user's orders
router.get('/', (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const orders = readData(ORDERS_FILE);
        const userOrders = orders
            .filter(o => o.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(userOrders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:id - Get single order
router.get('/:id', (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const orders = readData(ORDERS_FILE);
        const order = orders.find(o => o.id === parseInt(req.params.id) && o.userId === userId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// POST /api/orders - Create order from cart
router.post('/', (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { shippingAddress } = req.body;

        if (
            !shippingAddress ||
            !shippingAddress.name ||
            !shippingAddress.address ||
            !shippingAddress.city ||
            !shippingAddress.zip
        ) {
            return res.status(400).json({ error: 'Complete shipping address is required' });
        }

        // Get user's cart
        const carts = readData(CARTS_FILE);
        const products = readData(PRODUCTS_FILE);
        const cart = carts.find(c => c.userId === userId);

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Build order items with product details
        const orderItems = cart.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                productId: item.productId,
                name: product ? product.name : 'Unknown Product',
                price: product ? product.price : 0,
                image: product ? product.image : '',
                quantity: item.quantity,
            };
        });

        // Calculate total
        const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Create order
        const orders = readData(ORDERS_FILE);
        const newOrder = {
            id: generateId(orders),
            userId,
            items: orderItems,
            total: Math.round(total * 100) / 100,
            status: 'pending',
            shippingAddress,
            createdAt: new Date().toISOString(),
        };

        orders.push(newOrder);
        writeData(ORDERS_FILE, orders);

        // Clear user's cart
        const cartIndex = carts.findIndex(c => c.userId === userId);
        if (cartIndex > -1) {
            carts[cartIndex].items = [];
            carts[cartIndex].updatedAt = new Date().toISOString();
            writeData(CARTS_FILE, carts);
        }

        res.status(201).json({
            message: 'Order placed successfully',
            order: newOrder,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// PUT /api/orders/:id/status - Update order status (for demo/admin)
router.put('/:id/status', (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
        }

        const orders = readData(ORDERS_FILE);
        const orderIndex = orders.findIndex(o => o.id === parseInt(req.params.id));

        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found' });
        }

        orders[orderIndex].status = status;
        orders[orderIndex].updatedAt = new Date().toISOString();
        writeData(ORDERS_FILE, orders);

        res.json({ message: 'Order status updated', order: orders[orderIndex] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

module.exports = router;
