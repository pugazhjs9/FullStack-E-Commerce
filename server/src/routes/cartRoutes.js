const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataUtils');

const CARTS_FILE = 'carts.json';
const PRODUCTS_FILE = 'products.json';

// Helper to get user ID from token
const getUserIdFromToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    const tokenParts = token.split('_');
    return tokenParts.length >= 2 ? parseInt(tokenParts[1]) : null;
};

// GET /api/cart - Get user's cart
router.get('/', (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const carts = readData(CARTS_FILE);
        const products = readData(PRODUCTS_FILE);

        let cart = carts.find(c => c.userId === userId);

        if (!cart) {
            cart = { userId, items: [], updatedAt: new Date().toISOString() };
        }

        // Enrich cart items with product details
        const enrichedItems = cart.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                ...item,
                product: product || null
            };
        }).filter(item => item.product !== null);

        // Calculate totals
        const subtotal = enrichedItems.reduce(
            (sum, item) => sum + (item.product.price * item.quantity),
            0
        );

        res.json({
            items: enrichedItems,
            itemCount: enrichedItems.reduce((sum, item) => sum + item.quantity, 0),
            subtotal: Math.round(subtotal * 100) / 100
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// POST /api/cart - Add item to cart
router.post('/', (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        // Verify product exists
        const products = readData(PRODUCTS_FILE);
        const product = products.find(p => p.id === parseInt(productId));
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const carts = readData(CARTS_FILE);
        let cartIndex = carts.findIndex(c => c.userId === userId);

        if (cartIndex === -1) {
            // Create new cart for user
            carts.push({
                userId,
                items: [],
                updatedAt: new Date().toISOString()
            });
            cartIndex = carts.length - 1;
        }

        // Check if item already in cart
        const itemIndex = carts[cartIndex].items.findIndex(
            item => item.productId === parseInt(productId)
        );

        if (itemIndex > -1) {
            // Update quantity
            carts[cartIndex].items[itemIndex].quantity += parseInt(quantity);
        } else {
            // Add new item
            carts[cartIndex].items.push({
                productId: parseInt(productId),
                quantity: parseInt(quantity)
            });
        }

        carts[cartIndex].updatedAt = new Date().toISOString();
        writeData(CARTS_FILE, carts);

        res.json({ message: 'Item added to cart', cart: carts[cartIndex] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
});

// PUT /api/cart/:productId - Update item quantity
router.put('/:productId', (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const productId = parseInt(req.params.productId);
        const { quantity } = req.body;

        if (quantity === undefined || quantity < 0) {
            return res.status(400).json({ error: 'Valid quantity is required' });
        }

        const carts = readData(CARTS_FILE);
        const cartIndex = carts.findIndex(c => c.userId === userId);

        if (cartIndex === -1) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const itemIndex = carts[cartIndex].items.findIndex(
            item => item.productId === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        if (quantity === 0) {
            // Remove item if quantity is 0
            carts[cartIndex].items.splice(itemIndex, 1);
        } else {
            carts[cartIndex].items[itemIndex].quantity = parseInt(quantity);
        }

        carts[cartIndex].updatedAt = new Date().toISOString();
        writeData(CARTS_FILE, carts);

        res.json({ message: 'Cart updated', cart: carts[cartIndex] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

// DELETE /api/cart/:productId - Remove item from cart
router.delete('/:productId', (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const productId = parseInt(req.params.productId);
        const carts = readData(CARTS_FILE);
        const cartIndex = carts.findIndex(c => c.userId === userId);

        if (cartIndex === -1) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const itemIndex = carts[cartIndex].items.findIndex(
            item => item.productId === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        carts[cartIndex].items.splice(itemIndex, 1);
        carts[cartIndex].updatedAt = new Date().toISOString();
        writeData(CARTS_FILE, carts);

        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
});

// DELETE /api/cart - Clear entire cart
router.delete('/', (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const carts = readData(CARTS_FILE);
        const cartIndex = carts.findIndex(c => c.userId === userId);

        if (cartIndex > -1) {
            carts[cartIndex].items = [];
            carts[cartIndex].updatedAt = new Date().toISOString();
            writeData(CARTS_FILE, carts);
        }

        res.json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

module.exports = router;
