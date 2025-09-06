# AS Capitals Backend API

A comprehensive Node.js backend API built with TypeScript, Express, MongoDB, and AWS S3 integration for property management and user authentication.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (User, Admin, Super Admin)
- **Property Management**: Complete CRUD operations for property listings
- **File Upload**: AWS S3 integration for image and document uploads
- **User Management**: User registration, login, profile management
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Winston and Morgan for comprehensive logging
- **Error Handling**: Global error handling with proper HTTP status codes
- **TypeScript**: Full TypeScript support with proper type definitions

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- AWS Account with S3 bucket configured
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd as-capitals-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/as-capitals

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d

   # AWS Configuration
   AWS_ACCESS_KEY_ID=your-aws-access-key-id
   AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=as-capitals-bucket

   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000,http://localhost:3001

   # Logging Configuration
   LOG_LEVEL=info
   LOG_FILE_PATH=./logs/app.log
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── aws.ts       # AWS S3 configuration
│   ├── database.ts  # MongoDB connection
│   └── logger.ts     # Winston logger setup
├── controllers/      # Route controllers
│   ├── authController.ts
│   └── propertyController.ts
├── middleware/      # Custom middleware
│   ├── auth.ts      # Authentication middleware
│   ├── errorHandler.ts
│   ├── rateLimiter.ts
│   ├── upload.ts   # File upload middleware
│   └── validation.ts
├── models/          # MongoDB models
│   ├── User.ts
│   └── Property.ts
├── routes/          # API routes
│   ├── authRoutes.ts
│   ├── propertyRoutes.ts
│   └── fileRoutes.ts
├── services/        # Business logic
│   ├── authService.ts
│   ├── propertyService.ts
│   └── fileService.ts
├── types/           # TypeScript type definitions
│   └── index.ts
├── utils/           # Utility functions
│   ├── constants.ts
│   └── helpers.ts
├── app.ts           # Express app configuration
└── index.ts         # Server entry point
```

## 🔗 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| PUT | `/change-password` | Change password | Yes |
| PUT | `/deactivate` | Deactivate account | Yes |
| GET | `/users` | Get all users (Admin) | Yes |
| GET | `/users/:id` | Get user by ID (Admin) | Yes |

### Property Routes (`/api/properties`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all properties | No |
| POST | `/` | Create property | Yes |
| GET | `/stats` | Get property statistics (Admin) | Yes |
| GET | `/:id` | Get property by ID | No |
| PUT | `/:id` | Update property | Yes |
| DELETE | `/:id` | Delete property | Yes |
| POST | `/:id/images` | Upload property images | Yes |
| DELETE | `/:id/images` | Delete property image | Yes |
| GET | `/owner/:ownerId` | Get properties by owner | No |
| GET | `/agent/:agentId` | Get properties by agent | No |

### File Routes (`/api/files`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/upload` | Upload single file | Yes |
| POST | `/upload-multiple` | Upload multiple files | Yes |
| POST | `/upload-profile` | Upload profile image | Yes |
| DELETE | `/delete` | Delete file | Yes |
| GET | `/exists` | Check if file exists | Yes |

## 🔐 User Roles

- **User**: Basic user with property management capabilities
- **Admin**: Can manage all properties and users
- **Super Admin**: Full system access

## 📝 Request/Response Examples

### User Registration
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

### Property Creation
```json
POST /api/properties
{
  "title": "Beautiful House",
  "description": "A beautiful 3-bedroom house",
  "price": 500000,
  "location": {
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "propertyType": "house",
  "bedrooms": 3,
  "bathrooms": 2,
  "squareFeet": 2000,
  "features": ["garage", "garden", "pool"]
}
```

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express
- **File Upload Security**: File type and size validation

## 📊 Logging

The application uses Winston for structured logging with different levels:
- **Error**: Error messages
- **Warn**: Warning messages
- **Info**: General information
- **HTTP**: HTTP request logs (via Morgan)

Logs are written to both console and files in the `logs/` directory.

## 🚀 Deployment

### Environment Variables for Production
Make sure to set the following environment variables in your production environment:

```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
AWS_ACCESS_KEY_ID=your-production-aws-key
AWS_SECRET_ACCESS_KEY=your-production-aws-secret
AWS_S3_BUCKET_NAME=your-production-bucket
```

### Build and Deploy
```bash
npm run build
npm start
```

## 🧪 Testing

The project is set up for testing with proper TypeScript configuration. You can add your test files in a `tests/` directory.

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please contact the development team.

---

**Note**: Make sure to replace placeholder values in the environment configuration with your actual credentials and configuration values.
