# Asset Update and Relations Fixes

## Issues Fixed

### 1. Duplicate Key Error on Asset Update

**Problem:** When updating an asset with asset parts, the mutation failed with:
```
duplicate key value violates unique constraint "asset_parts_asset_id_master_part_id_key"
```

**Root Cause:** The unique constraint on `asset_parts` table didn't account for soft-deleted records. When updating, the code soft-deletes existing parts (sets `deleted_at`) but the unique constraint still applied to deleted records, preventing insertion of parts with the same `asset_id` and `master_asset_part_id`.

**Solution:** Replaced the unique constraint with a **partial unique index** that only applies to non-deleted records:

```sql
-- Old constraint (applies to all records including deleted)
ALTER TABLE asset_parts 
ADD CONSTRAINT asset_parts_asset_id_master_part_id_key 
UNIQUE (asset_id, master_asset_part_id);

-- New partial index (only applies to non-deleted records)
CREATE UNIQUE INDEX asset_parts_asset_id_master_part_id_active_key 
ON asset_parts (asset_id, master_asset_part_id) 
WHERE deleted_at IS NULL;
```

**Migration:** Applied to template schema and all 21 tenant schemas successfully.

---

### 2. Asset Relations - Single vs Multiple

**Problem:** The GraphQL schema and resolvers only supported a single asset relation:
- `fedFromAssetId: ID`
- `fedFromAssetPartId: ID`

This didn't allow users to define multiple relations for an asset (e.g., an asset fed from multiple sources).

**Solution:** Updated to support multiple asset relations using an array:

**GraphQL Schema Changes:**

```graphql
# Old (single relation)
input CreateAssetInput {
  fedFromAssetId: ID
  fedFromAssetPartId: ID
}

# New (multiple relations)
input CreateAssetInput {
  assetRelations: [AssetRelationInput!]
}

input AssetRelationInput {
  fedFromAssetId: ID!
  fedFromAssetPartId: ID
}
```

**Resolver Changes:**
- Updated `createAsset` mutation to insert multiple relations
- Updated `updateAsset` mutation to replace all relations

---

## Files Modified

### Database Schema
- [ca_template_tenant.sql](file:///Users/rakeshkasa/IBaseIT/code/critical-asset-apis/migrations/ca_template_tenant.sql#L636-L641) - Replaced unique constraint with partial index

### Migration Scripts
- [fix_asset_parts_unique_constraint.sql](file:///Users/rakeshkasa/IBaseIT/code/critical-asset-apis/migrations/fix_asset_parts_unique_constraint.sql) - Migration for constraint fix

### GraphQL Schema
- [asset.graphql](file:///Users/rakeshkasa/IBaseIT/code/critical-asset-apis/services/graphql-service/src/schema/asset.graphql) - Added `AssetRelationInput`, updated `CreateAssetInput` and `UpdateAssetInput`

### Resolvers
- [asset.js](file:///Users/rakeshkasa/IBaseIT/code/critical-asset-apis/services/graphql-service/src/resolvers/asset.js) - Updated `createAsset` and `updateAsset` mutations

---

## Usage Examples

### Creating Asset with Multiple Relations

```graphql
mutation {
  createAsset(input: {
    name: "HVAC Unit - Building A"
    assetTypeId: "..."
    locationIds: ["..."]
    assetRelations: [
      {
        fedFromAssetId: "generator-1"
        fedFromAssetPartId: "power-output-1"
      },
      {
        fedFromAssetId: "generator-2"
        fedFromAssetPartId: "power-output-2"
      }
    ]
  }) {
    id
    assetRelations {
      fedFromId
      fedFromPartId
    }
  }
}
```

### Updating Asset with New Relations

```graphql
mutation {
  updateAsset(
    id: "asset-id"
    input: {
      assetRelations: [
        {
          fedFromAssetId: "new-source-asset"
        }
      ]
    }
  ) {
    id
    assetRelations {
      fedFromId
    }
  }
}
```

---

## Testing

✅ **Verified:**
- Unique constraint fix applied to all 21 tenant schemas
- Asset update no longer throws duplicate key error
- Multiple asset relations can be created and updated
- GraphQL service auto-reloaded with new schema
