# GraphQL API Documentation

This directory contains comprehensive documentation and Postman collections for all GraphQL APIs in the `critical-asset-apis` project.

## 📊 Quick Stats

- **Total GraphQL APIs**: 156
- **Total Queries**: 56
- **Total Mutations**: 100
- **API Categories**: 14

## 📁 Directory Structure

```
api-docs/
├── README.md (this file)
├── graphql-api-analysis.md
└── postman-collections/ (to be created)
```

## 📄 Documentation Files

### [graphql-api-analysis.md](./graphql-api-analysis.md)
Comprehensive analysis of all GraphQL APIs including:
- Executive summary with overall statistics
- Detailed breakdown of all 156 APIs organized by 14 functional categories
- Complete list of queries and mutations for each category
- Schema file references

## 🗂️ API Categories

1. **Authentication & User Management** - 17 APIs
2. **Asset Management** - 14 APIs
3. **Location Management** - 11 APIs
4. **Master Data Management** - 54 APIs
5. **Work Order Management** - 6 APIs
6. **Ticket Management** - 10 APIs
7. **Maintenance Schedule Management** - 6 APIs
8. **File Management** - 6 APIs
9. **Plan Management** - 5 APIs
10. **Company Plan Management** - 5 APIs
11. **AI Addon Management** - 10 APIs
12. **AI Service & Credits** - 6 APIs
13. **Company AI Configuration** - 5 APIs
14. **Location Type Management** - 5 APIs

## 🚀 Next Steps

The implementation plan for creating Postman collections has been prepared. Each of the 14 categories will have its own dedicated Postman collection with:

- Organized folders for Queries and Mutations
- JWT authentication setup
- Environment variables
- Example requests with sample data
- Response validation tests

## 📝 Notes

- All analysis is based on the actual GraphQL schema files in `services/graphql-service/src/schema/`
- Existing Postman collections in the project root have been disregarded as requested
- This documentation reflects the current state of the GraphQL service as of the analysis date
