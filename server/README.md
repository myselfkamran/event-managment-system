# Event Management System with Reservations

A full-stack web application for managing events and reservations with JWT authentication, role-based access control, Redis caching, real-time notifications, and PostgreSQL database.

## 🚀 Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (user/admin)
  - Secure password hashing with bcrypt

- **Event Management**
  - Create, read, update, delete events
  - Event filtering and pagination
  - Capacity management with available spots tracking
  - Popular events calculation
  - Event statistics and analytics

- **Reservation System**
  - Reserve spots for events
  - Cancel reservations
  - Real-time spot availability updates
  - Prevent double bookings
  - Reservation status tracking (confirmed/canceled)
  - Admin restriction: Cannot reserve own events

- **Real-time Updates**
  - Socket.IO integration for real-time updates
  - Live event and reservation updates
  - Admin dashboard statistics

- **Caching System**
  - Redis caching for improved performance
  - Event list caching
  - Popular events caching
  - Cache invalidation on data updates

- **Admin Panel**
  - Complete CRUD operations for users, events, reservations
  - Dashboard with statistics
  - User management
  - Event details with reservation lists
  - Real-time data updates

- **Security**
  - Helmet.js for security headers
  - CORS configuration
  - Input validation and sanitization
  - SQL injection protection
  - Rate limiting

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Sequelize ORM
- **Caching**: Redis for performance optimization
- **Real-time**: Socket.IO for live updates (optional)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (Neon recommended)
- Redis server (for caching)
- npm or yarn

## ⚙️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd peak-one
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Update the `.env` file with your actual database and Redis URLs:
   ```env
   # Database Configuration (Replace with your Neon URL)
   DATABASE_URL=postgresql://username:password@ep-something.region.aws.neon.tech/database?sslmode=require
   
   # Redis Configuration
   REDIS_URL=redis://localhost:6379
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=4000
   NODE_ENV=development
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
   ```

4. **Database Setup**
   
   Seed the database with admin and test users:
   ```bash
   npm run seed
   ```

5. **Start Redis Server**
   
   Make sure Redis is running:
   ```bash
   # On macOS with Homebrew
   brew services start redis
   
   # On Ubuntu/Debian
   sudo systemctl start redis
   
   # Or start manually
   redis-server
   ```

6. **Start the application**
   
   Development mode:
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm run build
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

### Event Endpoints

#### Get All Events
```http
GET /api/events?page=1&limit=10&name=conference&location=online&date=2024-01-01
```

#### Get Event by ID
```http
GET /api/events/:id
```

#### Get Popular Events
```http
GET /api/events/popular
```

#### Create Event (Admin Only)
```http
POST /api/events
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "name": "Tech Conference 2024",
  "description": "Annual technology conference",
  "eventDate": "2024-12-01T10:00:00Z",
  "location": "Convention Center",
  "onlineLink": "https://zoom.us/meeting/123",
  "maxCapacity": 100
}
```

#### Update Event (Admin Only)
```http
PUT /api/events/:id
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "name": "Updated Event Name",
  "maxCapacity": 150
}
```

#### Delete Event (Admin Only)
```http
DELETE /api/events/:id
Authorization: Bearer <admin_jwt_token>
```

#### Get Dashboard Statistics (Admin Only)
```http
GET /api/events/dashboard/stats
Authorization: Bearer <admin_jwt_token>
```

### Reservation Endpoints

#### Reserve Event Spot (User)
```http
POST /api/reservations/events/:id/reserve
Authorization: Bearer <user_jwt_token>
```

> **Note**: Admins cannot reserve spots for their own events. This will return a 400 error with the message "You cannot reserve a spot for your own event".

#### Cancel Reservation (User/Admin)
```http
DELETE /api/reservations/:id
Authorization: Bearer <jwt_token>
```

#### Get My Reservations (User)
```http
GET /api/reservations/my-reservations?page=1&limit=10&status=confirmed
Authorization: Bearer <user_jwt_token>
```

#### Get Event Reservations (Admin Only)
```http
GET /api/reservations/events/:id/reservations?page=1&limit=10
Authorization: Bearer <admin_jwt_token>
```

#### Get All Reservations (Admin Only)
```http
GET /api/reservations?page=1&limit=10&eventId=1&userId=1&status=confirmed
Authorization: Bearer <admin_jwt_token>
```

#### Check User Reservation
```http
GET /api/reservations/check/:eventId
Authorization: Bearer <user_jwt_token>
```

### User Management Endpoints (Admin Only)

#### Get All Users
```http
GET /api/users?page=1&limit=10&search=john
Authorization: Bearer <admin_jwt_token>
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <admin_jwt_token>
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "firstName": "Updated",
  "lastName": "Name",
  "role": "admin"
}
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <admin_jwt_token>
```

#### Update Profile (User)
```http
PUT /api/users/profile/me
Authorization: Bearer <user_jwt_token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "firstName": "Updated",
  "lastName": "Name"
}
```



## 🔐 Default Credentials

After running the seed script, you can use these credentials:

**Admin User:**
- Email: `admin@example.com`
- Password: `admin123`

**Test User:**
- Email: `user@example.com`
- Password: `user123`

⚠️ **Important**: Change these passwords in production!

## 🏗️ Project Structure

```
src/
├── config/          # Database and Redis configuration
├── controllers/     # Request handlers
├── middleware/      # Authentication, validation, etc.
├── models/          # Sequelize models
├── routes/          # API routes
├── scripts/         # Database seeding and utilities
├── services/        # Business logic and services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## 🧪 Testing the API

You can test the API using tools like:
- Postman
- Insomnia
- curl
- Thunder Client (VS Code extension)

### Example Test Flow

1. **Register a new user**
2. **Login to get JWT token**
3. **Create an event (as admin)**
4. **Reserve a spot (as user)**
5. **View reservations**
6. **Cancel reservation**
7. **Check real-time updates**

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run seed` - Seed database with initial data

## 🐛 Error Handling

The API includes comprehensive error handling:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Conflict errors (409)
- Server errors (500)

## 📈 Performance Features

- **Redis Caching**: Event lists, popular events, and user data
- **Database Indexing**: Optimized queries with proper indexes
- **Rate Limiting**: Prevents API abuse
- **Pagination**: Efficient data loading for large datasets
- **Cache Invalidation**: Automatic cache updates on data changes

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Sequelize ORM prevents SQL injection
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Controlled cross-origin requests
- **Security Headers**: Helmet.js for security headers

## 🔄 Redis Integration

Redis is used for caching to improve performance:

### Cached Data Types
- **Event Lists**: Cached with pagination parameters
- **Popular Events**: Cached for 5 minutes
- **Event Details**: Cached by event ID
- **User Profiles**: Cached user data
- **User Sessions**: Cached session data

### Cache Keys
- `EVENT_LIST:${page}:${limit}:${filters}`
- `POPULAR_EVENTS`
- `EVENT_DETAILS:${eventId}`
- `USER_PROFILE:${userId}`
- `USER_SESSION:${userId}`

### Cache Invalidation
- Automatic invalidation on data updates
- Manual cache clearing for admin operations
- Time-based expiration for popular events

## 📡 Real-time Features

### Socket.IO Integration
- **Real-time Updates**: Live event and reservation updates
- **Admin Dashboard**: Real-time statistics updates
- **Live Data Sync**: Automatic data synchronization

## 🚦 Health Check

Check if the server is running:
```http
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "development"
}
```

## 📊 Popular Events Algorithm

Events are ranked as "popular" based on:
1. **Upcoming Events Only**: `eventDate >= current date`
2. **Primary Sort**: Available spots (ASC) - fewer spots = more popular
3. **Secondary Sort**: Event date (ASC) - earlier events prioritized
4. **Limit**: Top 10 events returned
5. **Caching**: Results cached for 5 minutes

## 🔧 Environment Variables

### Required Variables
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PORT=4000
```

### Optional Variables
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

## 📝 License

This project is licensed under the ISC License. 