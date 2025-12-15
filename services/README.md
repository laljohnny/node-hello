# Critical Asset Management Platform - Services

## Overview

Microservices architecture for the Critical Asset Management Platform with separate services for authentication, file management, Stripe integration, and AI addon management.

## Services

### 1. Auth Service (Port 3001)
Handles all authentication and user management operations.

**Endpoints:**
- `POST /auth/signup` - Company signup with schema creation
- `POST /auth/login` - User login with JWT
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/send-invitation` - Send user invitation
- `POST /auth/accept-invitation` - Accept invitation and create account
- `POST /auth/reset-password-request` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/enable-2fa` - Enable two-factor authentication
- `POST /auth/verify-2fa` - Verify 2FA code
- `POST /auth/switch-company-context` - Switch company (partners/superadmin)

**Features:**
- Multi-tenant schema-based authentication
- JWT with Hasura claims
- SendGrid email integration
- 2FA support (speakeasy)
- Password hashing (bcrypt)

### 2. File Service (Port 3002)
Manages file uploads to AWS S3 with CloudFront CDN.

**Endpoints:**
- `POST /files/generate-upload-url` - Generate pre-signed S3 URL
- `POST /files/confirm-upload` - Confirm upload and save metadata
- `POST /files/delete-file` - Delete file from S3 and database

**Features:**
- AWS S3 integration
- CloudFront CDN support
- File type validation
- Thumbnail generation (for images)

### 3. Stripe Service (Port 3003)
Handles all payment and subscription operations.

**Endpoints:**
- `POST /stripe/create-checkout-session` - Create plan checkout
- `POST /stripe/create-addon-checkout` - Create AI addon checkout
- `POST /stripe/cancel-subscription` - Cancel subscription
- `POST /stripe/update-payment-method` - Update payment method
- `POST /stripe/get-billing-portal-url` - Get billing portal URL
- `POST /stripe/webhook` - Handle Stripe webhooks

**Features:**
- Stripe Checkout integration
- Subscription management
- Webhook event handling
- Customer portal

### 4. AI Addon Service (Port 3004)
Manages AI addon credit consumption and tracking.

**Endpoints:**
- `POST /ai-addon/consume-credits` - Consume credits with validation
- `GET /ai-addon/check-credit-limit` - Check available credits

**Features:**
- Credit validation
- Usage tracking
- Low credit alerts
- Atomic transactions

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- AWS Account (S3, CloudFront)
- Stripe Account
- SendGrid Account

### Installation

1. **Install dependencies for each service:**
```bash
cd services/auth-service && npm install
cd ../file-service && npm install
cd ../stripe-service && npm install
cd ../ai-addon-service && npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Run migrations:**
```bash
chmod +x run_migrations.sh
./run_migrations.sh
```

### Running Services

**Option 1: Docker Compose (Recommended)**
```bash
docker-compose up -d
```

**Option 2: Individual Services**
```bash
# Terminal 1 - Auth Service
cd services/auth-service
npm run dev

# Terminal 2 - File Service
cd services/file-service
npm run dev

# Terminal 3 - Stripe Service
cd services/stripe-service
npm run dev

# Terminal 4 - AI Addon Service
cd services/ai-addon-service
npm run dev
```

### Running Hasura
```bash
# Start Hasura (included in docker-compose)
docker-compose up hasura

# Or run standalone
hasura console
```

## Development

### Testing Auth Service
```bash
# Signup
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "companyName": "Test Company",
      "email": "admin@test.com",
      "password": "SecurePass123!",
      "firstName": "John",
      "lastName": "Doe",
      "subdomain": "testco"
    }
  }'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "email": "admin@test.com",
      "password": "SecurePass123!"
    }
  }'
```

### Testing with Hasura
1. Open Hasura Console: http://localhost:8080
2. Use the access token from login in the request headers:
   ```
   Authorization: Bearer <access_token>
   ```

## Architecture

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Hasura GraphQL API          │
│  (JWT Auth, Permissions, Actions)   │
└──────┬──────────────────────────────┘
       │
       ├──────────┬──────────┬──────────┬──────────┐
       ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐
│   Auth   │ │  File  │ │ Stripe  │ │AI Addon │ │PostgreSQL│
│ Service  │ │Service │ │ Service │ │ Service │ │  (Multi  │
│          │ │        │ │         │ │         │ │  Tenant) │
└──────────┘ └────────┘ └─────────┘ └─────────┘ └──────────┘
     │            │           │           │
     ▼            ▼           ▼           │
┌──────────┐ ┌────────┐ ┌─────────┐     │
│SendGrid  │ │AWS S3  │ │ Stripe  │     │
│  Email   │ │CloudFrt│ │   API   │     │
└──────────┘ └────────┘ └─────────┘     │
                                         │
     ┌───────────────────────────────────┘
     ▼
┌──────────────────────────────────────┐
│  public schema                       │
│  - companies, users, plans, etc.     │
│                                      │
│  ca_acme_corp schema                 │
│  - assets, locations, work orders    │
│                                      │
│  ca_other_company schema             │
│  - assets, locations, work orders    │
└──────────────────────────────────────┘
```

## Security

### JWT Claims
All JWTs include Hasura claims for row-level security:
```json
{
  "x-hasura-allowed-roles": ["company_admin", "team_member"],
  "x-hasura-default-role": "company_admin",
  "x-hasura-user-id": "uuid",
  "x-hasura-company-id": "uuid",
  "x-hasura-schema": "ca_acme_corp"
}
```

### Environment Variables
Never commit `.env` files. Use `.env.example` as a template.

### Database Security
- Row-level security via Hasura permissions
- Schema-based tenant isolation
- Encrypted passwords (bcrypt)
- Parameterized queries (SQL injection prevention)

## Monitoring

### Health Checks
Each service exposes a `/health` endpoint:
```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

### Logs
Services use Morgan for HTTP logging. View logs:
```bash
docker-compose logs -f auth-service
docker-compose logs -f file-service
docker-compose logs -f stripe-service
docker-compose logs -f ai-addon-service
```

## Deployment

### Production Checklist
- [ ] Update all secrets in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS for production domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure AWS S3 bucket policies
- [ ] Set up Stripe webhooks
- [ ] Configure SendGrid domain authentication
- [ ] Set up database backups
- [ ] Configure monitoring and alerts
- [ ] Set up CI/CD pipeline

## Troubleshooting

### Common Issues

**1. Database connection errors**
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Check firewall rules

**2. JWT errors**
- Ensure JWT_SECRET matches in all services and Hasura
- Check token expiration times

**3. Email not sending**
- Verify SENDGRID_API_KEY
- Check SendGrid sender authentication
- Review SendGrid activity logs

**4. File upload failures**
- Verify AWS credentials
- Check S3 bucket permissions
- Ensure CloudFront is configured

**5. Stripe webhook failures**
- Verify STRIPE_WEBHOOK_SECRET
- Check webhook endpoint is publicly accessible
- Review Stripe webhook logs

## Next Steps

1. Implement remaining action handlers (2FA, password reset)
2. Add comprehensive error handling
3. Write unit and integration tests
4. Set up CI/CD pipeline
5. Configure production deployment
6. Add monitoring and logging
7. Implement rate limiting
8. Add API documentation (Swagger/OpenAPI)

## Support

For issues or questions:
- Check the main README.md
- Review implementation_plan.md
- Check Hasura documentation: https://hasura.io/docs
