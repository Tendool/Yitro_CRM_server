# User Management Guide

## How to Create and Manage Users

### Creating New Users (Admin Only)

When you create a new user account as an admin, you have two options:

#### Option 1: Auto-Generated Password (Recommended)
Create a user without specifying a password, and the system will generate a secure one for you:

```bash
# API Request
POST /api/admin/create-user
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "newuser@company.com",
  "displayName": "John Doe",
  "role": "user"
}
```

**Response includes the temporary password:**
```json
{
  "success": true,
  "user": {
    "id": "user-123456789",
    "email": "newuser@company.com",
    "displayName": "John Doe",
    "role": "USER"
  },
  "temporaryPassword": "a8K9mP2nQ7xR",
  "message": "User created successfully. Temporary password: a8K9mP2nQ7xR"
}
```

#### Option 2: Custom Password
Specify a custom password during user creation:

```bash
# API Request
POST /api/admin/create-user
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "newuser@company.com",
  "displayName": "John Doe",
  "role": "user",
  "password": "MySecurePassword123"
}
```

**Response (password not exposed):**
```json
{
  "success": true,
  "user": {
    "id": "user-123456789",
    "email": "newuser@company.com",
    "displayName": "John Doe",
    "role": "USER"
  },
  "message": "User created successfully with provided password."
}
```

### User Login Process

Once a user is created, they can log in using their email and password:

```bash
POST /api/auth/signin
Content-Type: application/json

{
  "email": "newuser@company.com",
  "password": "a8K9mP2nQ7xR"  // or the custom password
}
```

**Successful login response:**
```json
{
  "success": true,
  "message": "Signed in successfully",
  "data": {
    "user": {
      "id": "user-123456789",
      "email": "newuser@company.com",
      "displayName": "John Doe",
      "role": "user",
      "emailVerified": 1
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Testing Instructions

### 1. Test User Creation and Login

1. **Start the development server:**
   ```bash
   npm run dev:full
   ```

2. **Login as admin:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@yitro.com","password":"admin123"}'
   ```

3. **Extract the admin token from the response and create a new user:**
   ```bash
   curl -X POST http://localhost:3001/api/admin/create-user \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <admin_token>" \
     -d '{"email":"testuser@company.com","displayName":"Test User","role":"user"}'
   ```

4. **Note the temporary password from the response and test user login:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"testuser@company.com","password":"<temporary_password>"}'
   ```

### 2. Test Custom Password

```bash
# Create user with custom password
curl -X POST http://localhost:3001/api/admin/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"email":"customuser@company.com","displayName":"Custom User","role":"user","password":"MyPassword123"}'

# Test login with custom password
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"customuser@company.com","password":"MyPassword123"}'
```

## Deployment Configuration

### Environment Variables

Ensure these environment variables are set in production:

```env
# Security
JWT_SECRET=your-secure-jwt-secret-here

# Database
DATABASE_URL=your-database-connection-string

# Application
NODE_ENV=production
```

### Security Best Practices

1. **JWT Secret**: Use a strong, randomly generated JWT secret in production
2. **HTTPS**: Always use HTTPS in production to protect credentials in transit
3. **Password Policies**: Consider implementing password complexity requirements
4. **Rate Limiting**: Implement rate limiting on login endpoints
5. **Session Management**: Consider implementing session expiration and refresh tokens

### Production Deployment Steps

1. **Set up environment variables** in your deployment platform
2. **Initialize database** with `npm run init:db` (if using SQLite) or run Prisma migrations
3. **Build the application** with `npm run build`
4. **Start the production server** with `npm run start:production`

### Default Test Accounts

The system comes with these default accounts for testing:

- **Admin**: `admin@yitro.com` / `admin123`
- **User**: `user@yitro.com` / `user123`

**Note**: Change these default passwords in production!