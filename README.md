# Product Management Backend

This is the backend for the Product Management Application, built with Node.js, Express, and MikroORM. It provides secure RESTful APIs for product and order management, with data persisted in PostgreSQL.

## Features

- User authentication and authorization (JWT)
- Product management (CRUD operations)
- Order management and status updates
- Image upload for products
- Secure API endpoints for admin and users

## Tech Stack

- Node.js with Express
- TypeScript
- MikroORM with PostgreSQL
- JWT for authentication
- Multer for file uploads

## Project Structure

```
src/
  ├── config/        # Configuration files
  ├── controllers/   # API controllers
  ├── entities/      # Database entity models
  ├── middleware/    # Express middleware
  ├── seeders/       # Database seed scripts
  └── utils/         # Utility functions
uploads/             # Uploaded files
```

## Setup and Installation

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the backend directory with the following variables:

   ```
   PORT=3001
   DB_NAME=product_management
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=password
   JWT_SECRET=your_jwt_secret
   ADMIN_EMAIL=admin@admin.com
   ADMIN_PASSWORD=password123
   ```

3. Seed the database (admin user and sample products):

   ```bash
   npm run seed
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```
   The server will run on http://localhost:3001

## Testing

Run the backend tests:

```bash
npm test
```

## Deployment

1. Build the backend:

   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## License

This project is licensed under the MIT
