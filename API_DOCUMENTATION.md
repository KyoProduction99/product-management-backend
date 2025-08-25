# API Documentation

## Overview

This document provides detailed information about the Product Management API endpoints, request/response formats, and authentication requirements.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Many endpoints require authentication using JWT (JSON Web Token).

To authenticate, include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

### Get Authentication Token

```
POST /auth/login
```

**Request Body:**

```json
{
  "email": "admin@admin.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "admin@admin.com",
    "name": "Admin",
    "role": "admin"
  }
}
```

## Products API

### Get All Products

```
GET /products
```

**Query Parameters:**

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| page      | number | Page number (default: 1)     |
| limit     | number | Items per page (default: 10) |
| name      | string | Filter by product name       |
| category  | string | Filter by category           |
| sortField | string | Field to sort by             |
| sortOrder | string | Sort order (ASC or DESC)     |

**Response:**

```json
{
  "products": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Product Name",
      "description": "Product description",
      "category": "Electronics",
      "price": 99.99,
      "stock": 100,
      "imageUrl": "/uploads/products/image.jpg",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Get Product by ID

```
GET /products/:id
```

**Response:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Product Name",
  "description": "Product description",
  "category": "Electronics",
  "price": 99.99,
  "stock": 100,
  "imageUrl": "/uploads/products/image.jpg",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### Create Product

```
POST /products
```

**Authentication Required:** Yes (Admin only)

**Request Body (multipart/form-data):**

| Field       | Type   | Description            |
| ----------- | ------ | ---------------------- |
| name        | string | Product name           |
| description | string | Product description    |
| category    | string | Product category       |
| price       | number | Product price          |
| stock       | number | Product stock quantity |
| image       | file   | Product image file     |

**Response:**

```json
{
  "message": "Product created successfully"
}
```

### Update Product

```
PUT /products/:id
```

**Authentication Required:** Yes (Admin only)

**Request Body (multipart/form-data):**

| Field       | Type   | Description            |
| ----------- | ------ | ---------------------- |
| name        | string | Product name           |
| description | string | Product description    |
| category    | string | Product category       |
| price       | number | Product price          |
| stock       | number | Product stock quantity |
| image       | file   | Product image file     |

**Response:**

```json
{
  "message": "Product updated successfully"
}
```

### Delete Product

```
DELETE /products/:id
```

**Authentication Required:** Yes (Admin only)

**Response:**

```json
{
  "message": "Product deleted successfully"
}
```

## Orders API

### Create Order

```
POST /orders
```

**Request Body:**

```json
{
  "name": "Customer",
  "email": "customer@example.com",
  "contact": "1234567890",
  "address": "123 Address",
  "zipCode": "12345",
  "city": "City",
  "state": "State",
  "items": [
    {
      "productId": "123e4567-e89b-12d3-a456-426614174000",
      "quantity": 2
    }
  ]
}
```

**Response:**

```json
{
  "message": "Order created successfully",
  "order": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "totalAmount": 199.98,
    "status": "pending"
  }
}
```

### Get All Orders

```
GET /orders
```

**Authentication Required:** Yes (Admin only)

**Query Parameters:**

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| page      | number | Page number (default: 1)     |
| limit     | number | Items per page (default: 10) |

**Response:**

```json
{
  "orders": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Customer",
      "email": "customer@example.com",
      "contact": "1234567890",
      "address": "123 Address",
      "zipCode": "12345",
      "city": "City",
      "state": "State",
      "totalAmount": 199.98,
      "status": "pending",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Get Order by ID

```
GET /orders/:id
```

**Response:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Customer",
  "email": "customer@example.com",
  "contact": "1234567890",
  "address": "123 Address",
  "zipCode": "12345",
  "city": "City",
  "state": "State",
  "totalAmount": 199.98,
  "status": "pending",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "product": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Product Name",
        "imageUrl": "/uploads/products/image.jpg"
      },
      "quantity": 2,
      "price": 99.99
    }
  ]
}
```

### Update Order Status

```
PUT /orders/:id/status
```

**Authentication Required:** Yes (Admin only)

**Request Body:**

```json
{
  "status": "confirmed"
}
```

**Response:**

```json
{
  "message": "Order status updated successfully"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "message": "Invalid request parameters"
}
```

### 401 Unauthorized

```json
{
  "message": "Access token required"
}
```

### 403 Forbidden

```json
{
  "message": "Admin access required"
}
```

### 404 Not Found

```json
{
  "message": "Resource not found"
}
```

### 500 Server Error

```json
{
  "message": "Server error",
  "error": "Error details"
}
```
