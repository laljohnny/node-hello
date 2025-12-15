# Postman Collections for GraphQL API

This directory contains comprehensive Postman collections for all GraphQL APIs in the Critical Asset Management system.

## 📦 What's Included

### 🎯 Master Collection
- **`00-MASTER-complete-api.postman_collection.json`** - Complete collection with all 169 APIs
  - 64 Queries
  - 105 Mutations
  - 14 Categories
  - Use for: Complete API reference, documentation generation, comprehensive testing

### 📁 Category-Specific Collections (14 files)
Individual collections for focused development work:

1. **`01-authentication-user-management.postman_collection.json`** (21 APIs)
   - User signup, login, invitations, password reset, 2FA
   - Company and user management

2. **`02-asset-management.postman_collection.json`** (17 APIs)
   - Asset CRUD operations
   - SOPs and incident plans

3. **`03-location-management.postman_collection.json`** (7 APIs)
   - Location hierarchy management
   - Asset-location relationships

4. **`04-master-data-management.postman_collection.json`** (60 APIs)
   - Asset categories, types, parts, fields
   - Manufacturers, vendors
   - Work order types, stages, categories

5. **`05-work-order-management.postman_collection.json`** (6 APIs)
   - Work order creation and updates
   - Assignment and stage management

6. **`06-ticket-management.postman_collection.json`** (10 APIs)
   - Support tickets and comments

7. **`07-maintenance-schedule-management.postman_collection.json`** (6 APIs)
   - Preventive maintenance scheduling
   - Activity completion tracking

8. **`08-file-management.postman_collection.json`** (6 APIs)
   - File upload and storage
   - S3 integration

9. **`09-plan-management.postman_collection.json`** (5 APIs)
   - Subscription plan CRUD

10. **`10-company-plan-management.postman_collection.json`** (5 APIs)
    - Company subscriptions and billing

11. **`11-ai-addon-management.postman_collection.json`** (10 APIs)
    - AI addon products and subscriptions

12. **`12-ai-service-credits.postman_collection.json`** (6 APIs)
    - AI document generation
    - Credit usage tracking

13. **`13-company-ai-configuration.postman_collection.json`** (5 APIs)
    - AI provider configuration

14. **`14-location-type-management.postman_collection.json`** (5 APIs)
    - Master location type definitions

### 🌍 Environment File
- **`GraphQL-Environment.postman_environment.json`** - Shared environment variables
  - `graphql_url` - GraphQL endpoint (default: http://localhost:4000/graphql)
  - `access_token` - JWT access token (auto-saved after login)
  - `refresh_token` - JWT refresh token (auto-saved after login)
  - `company_id`, `user_id`, `schema_name` - User context variables

## 🚀 Quick Start

### 1. Import into Postman

**Option A: Import All Collections**
```
1. Open Postman
2. Click "Import" button
3. Select all .json files in this directory
4. Click "Import"
```

**Option B: Import Selectively**
```
1. Import GraphQL-Environment.postman_environment.json (required)
2. Import 00-MASTER-complete-api.postman_collection.json (for complete reference)
3. Import specific category collections as needed
```

### 2. Configure Environment

```
1. In Postman, select "GraphQL API Environment" from environment dropdown
2. Click the eye icon to view/edit environment
3. Update graphql_url if needed:
   - Development: http://localhost:4000/graphql
   - Production: https://your-domain.com/graphql
```

### 3. Authenticate

```
1. Open "01. Authentication & User Management" collection
2. Go to Mutations > signup or Mutations > login
3. Update the variables with your credentials
4. Send the request
5. ✅ Tokens are automatically saved to environment
6. All subsequent requests will use the saved token
```

### 4. Start Using APIs

```
1. Browse collections using Postman sidebar
2. Use search (Cmd/Ctrl + K) to find specific APIs
3. Each request includes example structure
4. Modify variables as needed
5. Send requests!
```

## 🔐 Authentication Flow

All APIs (except signup/login) require authentication:

```
1. User runs signup or login mutation
2. Response includes accessToken and refreshToken
3. Postman automatically saves tokens to environment variables
4. All subsequent requests include: Authorization: Bearer {{access_token}}
5. When access token expires, use refreshToken mutation
```

## 📖 Collection Structure

Each collection follows this structure:

```
Collection Name/
├── Queries/
│   ├── query1
│   ├── query2
│   └── ...
└── Mutations/
    ├── mutation1
    ├── mutation2
    └── ...
```

## 💡 Tips & Best Practices

### For Documentation
- Use the **master collection** for complete API reference
- Generate and publish documentation using Postman's "View Documentation" feature
- Share master collection with stakeholders for comprehensive overview

### For Development
- Use **category-specific collections** for day-to-day work
- Lighter, faster, easier to navigate
- Import only the categories you're working on

### For Testing
- Create separate environments for dev/staging/production
- Use collection variables for test data
- Leverage Postman's test scripts for automated validation

### Using GraphQL Variables
All requests support GraphQL variables. Example:

```graphql
mutation CreateAsset($input: CreateAssetInput!) {
  createAsset(input: $input) {
    id
    name
  }
}
```

Variables tab:
```json
{
  "input": {
    "name": "Generator #1",
    "assetTypeId": "asset-type-id",
    "locationIds": ["location-id"]
  }
}
```

## 🛠️ Maintenance

### Regenerating Collections

If GraphQL schemas change, regenerate collections:

```bash
cd api-docs/postman-collections

# Regenerate master collection
python3 generate_collection.py

# Extract category collections
python3 extract_categories.py
```

### Adding Custom Examples

Edit the generated collections in Postman:
1. Open the request
2. Update the GraphQL query
3. Add/modify variables
4. Save the collection
5. Export to update the JSON file

## 📊 Statistics

- **Total Collections**: 15 (1 master + 14 categories)
- **Total APIs**: 169
- **Total Queries**: 64
- **Total Mutations**: 105
- **Categories**: 14

## 🔗 Related Documentation

- **[graphql-api-analysis.md](../graphql-api-analysis.md)** - Complete API breakdown and statistics
- **[implementation_plan.md](../../.gemini/antigravity/brain/45ffba9d-12fb-419c-9c07-1b54ceb7c137/implementation_plan.md)** - Collection creation plan and strategy

## 📝 Notes

- All collections use the same GraphQL endpoint
- Authentication is handled via JWT tokens in Authorization header
- Collections are auto-generated from GraphQL schemas
- Example variables are provided as templates - customize as needed
- Collections are numbered for easy organization

## 🆘 Troubleshooting

### "Not authenticated" error
- Ensure you've run login/signup mutation
- Check that access_token is saved in environment
- Token may have expired - use refreshToken mutation

### "GraphQL endpoint not found"
- Verify graphql_url in environment is correct
- Ensure GraphQL service is running
- Check network connectivity

### Missing variables
- Each request includes example variable structure
- Customize variables based on your data
- Refer to GraphQL schema for required fields

---

**Generated**: December 2025  
**GraphQL Service**: services/graphql-service  
**Schema Version**: Current
