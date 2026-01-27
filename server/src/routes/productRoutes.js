const express = require('express');
const router = express.Router();
const { readData, writeData, generateId } = require('../utils/dataUtils');

const PRODUCTS_FILE = 'products.json';

// GET /api/products - Get all products with optional filtering
router.get('/', (req, res) => {
    try {
        let products = readData(PRODUCTS_FILE);
        const { category, search, sort, featured } = req.query;

        // Filter by category
        if (category && category !== 'all') {
            products = products.filter(p =>
                p.category.toLowerCase() === category.toLowerCase()
            );
        }

        // Filter by search term
        if (search) {
            const searchLower = search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(searchLower) ||
                p.description.toLowerCase().includes(searchLower)
            );
        }

        // Filter featured products
        if (featured === 'true') {
            products = products.filter(p => p.featured);
        }

        // Sort products
        if (sort) {
            switch (sort) {
                case 'price-low':
                    products.sort((a, b) => a.price - b.price);
                    break;
                case 'price-high':
                    products.sort((a, b) => b.price - a.price);
                    break;
                case 'rating':
                    products.sort((a, b) => b.rating - a.rating);
                    break;
                case 'name':
                    products.sort((a, b) => a.name.localeCompare(b.name));
                    break;
            }
        }

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/products/categories - Get all unique categories
router.get('/categories', (req, res) => {
    try {
        const products = readData(PRODUCTS_FILE);
        const categories = [...new Set(products.map(p => p.category))];
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/products/:id - Get single product
router.get('/:id', (req, res) => {
    try {
        const products = readData(PRODUCTS_FILE);
        const product = products.find(p => p.id === parseInt(req.params.id));

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// POST /api/products - Create new product
router.post('/', (req, res) => {
    try {
        const products = readData(PRODUCTS_FILE);
        const { name, description, price, category, image, stock } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ error: 'Name, price, and category are required' });
        }

        const newProduct = {
            id: generateId(products),
            name,
            description: description || '',
            price: parseFloat(price),
            category,
            image: image || 'https://via.placeholder.com/500',
            rating: 0,
            reviews: 0,
            stock: stock || 0,
            featured: false
        };

        products.push(newProduct);
        writeData(PRODUCTS_FILE, products);

        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// PUT /api/products/:id - Update product
router.put('/:id', (req, res) => {
    try {
        const products = readData(PRODUCTS_FILE);
        const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));

        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const updatedProduct = {
            ...products[productIndex],
            ...req.body,
            id: products[productIndex].id // Preserve original ID
        };

        products[productIndex] = updatedProduct;
        writeData(PRODUCTS_FILE, products);

        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', (req, res) => {
    try {
        const products = readData(PRODUCTS_FILE);
        const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));

        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        products.splice(productIndex, 1);
        writeData(PRODUCTS_FILE, products);

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
