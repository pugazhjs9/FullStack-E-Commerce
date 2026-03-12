# ShopSmart - E-Commerce Application

A modern fullstack e-commerce application built with ReactJS and NodeJS, using JSON file-based data storage (no database required).

## 🚀 Features

- **Product Catalog** - Browse 12+ products across multiple categories
- **Search & Filter** - Filter by category, search by name, sort by price/rating
- **Product Details** - View full product information with images and stock status
- **Shopping Cart** - Add/remove items, adjust quantities, view totals
- **User Authentication** - Register, login, and session management
- **Checkout** - Complete shipping form and place orders
- **Order History** - View past orders with status tracking
- **Responsive Design** - Works on mobile, tablet, and desktop

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router, Vite |
| Backend | Node.js, Express.js |
| Data Storage | JSON files |
| Styling | Vanilla CSS (modern dark theme) |

## 📁 Project Structure

```
e-commerce/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── App.jsx         # Main app with routing
│   │   └── index.css       # Global styles
│   └── package.json
│
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── data/           # JSON data files
│   │   ├── routes/         # API route handlers
│   │   ├── utils/          # Utility functions
│   │   ├── app.js          # Express app setup
│   │   └── index.js        # Server entry point
│   └── package.json
│
└── render.yaml             # Deployment configuration
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Quick Setup & Run (Recommended)

The easiest way to get started is to use the provided `run.sh` script. It will automatically install all dependencies and start both the frontend and backend concurrently.

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FullStack-E-Commerce
   ```

2. **Run the setup script**
   ```bash
   # Make the script executable (run once)
   chmod +x run.sh
   
   # Start the application
   ./run.sh
   ```

3. **Open your browser** and visit http://localhost:5173 (Backend runs at http://localhost:5001)

---

### Manual Setup

If you prefer to set up and run things manually without the bash script:

#### Installation

1. **Install root dependencies** (for concurrent run)
   ```bash
   npm install
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

#### Running Locally

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend (in a new terminal)**
   ```bash
   cd client
   npm run dev
   ```

3. **Open your browser** and visit http://localhost:5173

### Demo Account

Use the demo account to test the full shopping experience:
- **Email:** demo@shopsmart.com
- **Password:** demo123

Or click "Try Demo Account" on the login page.

## 📡 API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products (supports query params: category, search, sort) |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/products/categories` | Get all categories |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:productId` | Update item quantity |
| DELETE | `/api/cart/:productId` | Remove item from cart |
| DELETE | `/api/cart` | Clear cart |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get user's orders |
| GET | `/api/orders/:id` | Get single order |
| POST | `/api/orders` | Create order from cart |

## 🎨 Design Features

- **Dark Theme** - Modern dark UI with vibrant accent colors
- **Glassmorphism** - Subtle blur effects and transparency
- **Smooth Animations** - Hover effects and transitions
- **Responsive Layout** - Mobile-first design approach
- **Premium Typography** - Inter & Outfit fonts

## 🧪 Testing

```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test
```

## 🚀 Deployment

The project includes a `render.yaml` for easy deployment to Render:
- Backend deploys as a web service
- Frontend deploys as a static site

## 📝 License

MIT License
