const API_URL = import.meta.env.VITE_API_URL || "";

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Generic fetch wrapper
const fetchApi = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
};

// Products API
export const productsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/api/products${query ? `?${query}` : ""}`);
  },
  getById: (id) => fetchApi(`/api/products/${id}`),
  getCategories: () => fetchApi("/api/products/categories"),
  create: (product) =>
    fetchApi("/api/products", {
      method: "POST",
      body: JSON.stringify(product),
    }),
  update: (id, product) =>
    fetchApi(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    }),
  delete: (id) =>
    fetchApi(`/api/products/${id}`, {
      method: "DELETE",
    }),
};

// Auth API
export const authApi = {
  register: (userData) =>
    fetchApi("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),
  login: (credentials) =>
    fetchApi("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  getMe: () => fetchApi("/api/auth/me"),
};

// Cart API
export const cartApi = {
  get: () => fetchApi("/api/cart"),
  add: (productId, quantity = 1) =>
    fetchApi("/api/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    }),
  update: (productId, quantity) =>
    fetchApi(`/api/cart/${productId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),
  remove: (productId) =>
    fetchApi(`/api/cart/${productId}`, {
      method: "DELETE",
    }),
  clear: () =>
    fetchApi("/api/cart", {
      method: "DELETE",
    }),
};

// Orders API
export const ordersApi = {
  getAll: () => fetchApi("/api/orders"),
  getById: (id) => fetchApi(`/api/orders/${id}`),
  create: (shippingAddress) =>
    fetchApi("/api/orders", {
      method: "POST",
      body: JSON.stringify({ shippingAddress }),
    }),
};

// Health check
export const healthApi = {
  check: () => fetchApi("/api/health"),
};
