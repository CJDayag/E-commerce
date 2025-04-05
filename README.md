# eStore - Full Stack E-commerce Platform

A modern, full-stack e-commerce platform built with Django and React, featuring a comprehensive admin interface, product management, shopping cart, and checkout system.

![eStore Logo](https://via.placeholder.com/800x200?text=eStore+E-commerce+Platform)

## Project Overview

eStore is a complete e-commerce solution with a Django backend REST API and a React frontend. It provides features typical of modern online shops including product browsing, cart management, user authentication, order processing, and an admin dashboard with analytics.

## Technology Stack

### Backend
- **Django**: Web framework
- **Django REST Framework**: API development
- **SQLite**: Database

### Frontend
- **React 19**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool
- **React Router Dom**: Routing
- **TailwindCSS**: Styling
- **Shadcn/UI**: UI components
- **React Hook Form**: Form management
- **Zod**: Validation
- **Axios**: HTTP client
- **Recharts**: Data visualization
- **Lucide React**: Icon library

## Features

### Customer-facing Features
- Product browsing and searching
- Category-based navigation
- Shopping cart
- User authentication and profile management
- Order history and tracking
- Checkout process
- Contact and about pages

### Admin Features
- Dashboard with key metrics
- Order management
- Product management
- Analytics and reporting
- User management


## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/estore.git
   cd estore
   ```
2. Create and Activate a Virtual Environment
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install Dependencies
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables in a .env file
   ```.env
    DEBUG=True
    SECRET_KEY=your_secret_key
    DATABASE_URL=postgres://user:password@localhost/estore
   ```
5. Run Migrations
   ```bash
   python manage.py migrate
   ```
6. Create Superuser
   ```bash
   python manage.py createsuperuser
   ```
7. Run the Development server
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory
   ```bash
   cd frontend
   ```
2. Install Dependencies
   ```bash
   npm install
   ```
3. Start development server
   ```bash
   npm run dev
   ```
4. Access the application at
   ```
    http://localhost:5173
   ```
