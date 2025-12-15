# GraphQL Service

GraphQL API for Critical Asset Management Platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure the auth service is running on port 3001

3. Start the GraphQL server:
```bash
npm run dev
```

The GraphQL Playground will be available at: http://localhost:4000/graphql

## Environment Variables

Required variables (inherited from root `.env`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT verification
- `AUTH_SERVICE_URL` - URL of auth service (default: http://localhost:3001)
- `GRAPHQL_PORT` - Port for GraphQL server (default: 4000)

## Available Operations

### Authentication

#### Signup
```graphql
mutation Signup {
  signup(input: {
    companyName: "Test Company"
    email: "test@example.com"
    password: "SecurePass123!"
    firstName: "John"
    lastName: "Doe"
    subdomain: "testco"
  }) {
    accessToken
    refreshToken
    user {
      id
      email
      role
      schema
    }
  }
}
```

#### Login
```graphql
mutation Login {
  login(input: {
    email: "test@example.com"
    password: "SecurePass123!"
  }) {
    accessToken
    refreshToken
    user {
      id
      email
      role
      schema
    }
  }
}
```

#### Get Current User
```graphql
query Me {
  me {
    id
    email
    role
    schema
    companyId
  }
}
```

**Note:** Include the access token in the Authorization header:
```
Authorization: Bearer <your-access-token>
```

#### Refresh Token
```graphql
mutation RefreshToken {
  refreshToken(refreshToken: "your-refresh-token") {
    accessToken
    refreshToken
    user {
      id
      email
    }
  }
}
```

## Architecture

This GraphQL service acts as a wrapper around the existing REST auth service:
- Auth operations are proxied to the auth-service (port 3001)
- JWT tokens are verified for protected operations
- GraphQL context provides user info to all resolvers
- Database connection pool is shared across resolvers
