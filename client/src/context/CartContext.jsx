import { createContext, useContext, useState, useEffect } from 'react';
import { cartApi } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState({ items: [], itemCount: 0, subtotal: 0 });
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // Fetch cart when user logs in
    useEffect(() => {
        if (user) {
            fetchCart();
        } else {
            setCart({ items: [], itemCount: 0, subtotal: 0 });
        }
    }, [user]);

    const fetchCart = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await cartApi.get();
            setCart(data);
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (productId, quantity = 1) => {
        if (!user) {
            throw new Error('Please login to add items to cart');
        }
        try {
            await cartApi.add(productId, quantity);
            await fetchCart();
        } catch (error) {
            console.error('Failed to add to cart:', error);
            throw error;
        }
    };

    const updateQuantity = async (productId, quantity) => {
        try {
            await cartApi.update(productId, quantity);
            await fetchCart();
        } catch (error) {
            console.error('Failed to update cart:', error);
            throw error;
        }
    };

    const removeFromCart = async (productId) => {
        try {
            await cartApi.remove(productId);
            await fetchCart();
        } catch (error) {
            console.error('Failed to remove from cart:', error);
            throw error;
        }
    };

    const clearCart = async () => {
        try {
            await cartApi.clear();
            setCart({ items: [], itemCount: 0, subtotal: 0 });
        } catch (error) {
            console.error('Failed to clear cart:', error);
            throw error;
        }
    };

    return (
        <CartContext.Provider value={{
            cart,
            loading,
            addToCart,
            updateQuantity,
            removeFromCart,
            clearCart,
            refreshCart: fetchCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
