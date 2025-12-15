# Express + Prisma Boilerplate

A production-ready Express.js API with Prisma ORM, TypeScript, and authentication. This boilerplate follows best practices for building scalable and maintainable Node.js applications.

## 🚀 Features

- ✅ **TypeScript** - Full type safety across the application
- ✅ **Modular Architecture** - Clean separation of concerns with feature modules
- ✅ **Authentication** - JWT-based authentication with role-based access control
- ✅ **Database** - Prisma ORM with PostgreSQL
- ✅ **Validation** - Input validation for API endpoints
- ✅ **Error Handling** - Centralized error handling middleware
- ✅ **Logging** - Structured logging with Winston
- ✅ **Rate Limiting** - Protection against API abuse
- ✅ **Security** - Helmet.js for security headers
- ✅ **CORS** - Cross-origin resource sharing configuration
- ✅ **Testing** - Jest and Supertest for comprehensive testing
- ✅ **Docker** - Containerized deployment with Docker and Docker Compose
- ✅ **Environment Config** - Environment-based configuration management

## 📁 Project Structure

```
express-prisma-boilerplate/
├── src/
│   ├── config/           # Environment configuration
│   │   └── index.ts
│   ├── db/               # Database client and connection
│   │   └── client.ts
│   ├── middleware/        # Express middleware
│   │   ├── authGuard.ts
│   │   └── errorHandler.ts
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.types.ts
│   │   └── user/        # User module
│   │       ├── user.controller.ts
│   │       ├── user.routes.ts
│   │       ├── user.service.ts
│   │       ├── user.schema.ts
│   │       └── user.types.ts
│   ├── utils/            # Utility functions
│   │   └── logger.ts
│   ├── app.ts            # Express app configuration
│   └── server.ts         # Server startup
├── prisma/
│   ├── schema.prisma     # Prisma schema
│   └── seed.ts           # Database seed script
├── tests/                # Test files
│   ├── setup.ts
│   ├── auth.test.ts
│   └── user.test.ts
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile            # Production Docker image
├── Dockerfile.dev        # Development Docker image
├── .env.example          # Environment variables template
└── README.md
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Docker and Docker Compose (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd express-prisma-boilerplate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="7d"
   PORT=3000
   NODE_ENV="development"
   CORS_ORIGIN="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run generate
   
   # Run database migrations
   npm run migrate
   
   # Seed the database (optional)
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Docker Development

1. **Start with Docker Compose**
   ```bash
   # For development
   docker-compose --profile dev up
   
   # For production
   docker-compose up
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Change Password
```http
POST /api/v1/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh-token
Authorization: Bearer <token>
```

#### Verify Token
```http
GET /api/v1/auth/verify-token
Authorization: Bearer <token>
```

### User Endpoints

#### Get Profile
```http
GET /api/v1/users/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/v1/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name"
}
```

#### Get All Users (Admin Only)
```http
GET /api/v1/users?page=1&limit=10&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <admin-token>
```

#### Get User by ID (Admin Only)
```http
GET /api/v1/users/:id
Authorization: Bearer <admin-token>
```

#### Create User (Admin Only)
```http
POST /api/v1/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "New",
  "lastName": "User"
}
```

#### Update User (Admin Only)
```http
PUT /api/v1/users/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name"
}
```

#### Delete User (Admin Only)
```http
DELETE /api/v1/users/:id
Authorization: Bearer <admin-token>
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run migrate:deploy` - Deploy migrations to production
- `npm run generate` - Generate Prisma client
- `npm run seed` - Seed the database
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## 🔧 Configuration

The application can be configured through environment variables:

| Variable | Description | Default |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT tokens | - |
| `JWT_EXPIRES_IN` | JWT token expiration time | `7d` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (`development`, `production`) | `development` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## 🚀 Deployment

### Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t express-prisma-api .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Run database migrations**
   ```bash
   npm run migrate:deploy
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Web framework for Node.js
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [Jest](https://jestjs.io/) - Testing framework
- [Docker](https://www.docker.com/) - Container platform