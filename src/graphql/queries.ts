import { gql } from "@apollo/client";

// User Query
export const USER_QUERY = gql`
 query Me {
    me {
        id
        email
        firstName
        lastName
        role
        companyId
        schema
        twoFactorEnabled
    }
}
`;

// Companies Query
export const COMPANIES_QUERY = gql`
  query Companies {
    companies {
      id
    name
    email
    subdomain
    role
    parentCompanyId
    schemaName
    schemaStatus
    address
    city
    state
    country
    zip
    phoneNumber
    countryCode
    createdAt
    updatedAt
    website
    businessType
    industry
    }
  }
`;

// Company Users Query
export const COMPANY_USERS_QUERY = gql`
 query CompanyUsers {
    companyUsers {
        id
        email
        firstName
        lastName
        role
        companyId
        schema
        twoFactorEnabled
        invitationStatus
        invitedBy
        invitedOn
    }
}`;

// Users Query (deprecated - use COMPANY_USERS_QUERY instead)
export const USERS_QUERY = gql`
  query Users($roles: [SuperAdminRole!]) {
    users(filter: { roles: $roles }) {
      belongsToCompanyId
      createdAt
      deletedAt
      displayName
      email
      emailConfirmed
      firstName
      id
      lastName
      phone
      phoneConfirmed
      role
      twoFactorEnabled
      updatedAt
      belongsToCompany {
        active
        address1
        address2
        assetCount
        businessType
        canAddLocation
        city
        config
        coordinates
        countryAlpha2
        createdAt
        createdById
        deletedAt
        deletedById
        email
        fileSizeTotal
        id
        industry
        isMainCompany
        name
        parentId
        phone
        planId
        planStripeCancelAt
        planStripeCurrentPeriodEnd
        planStripeEndedAt
        planStripeId
        planStripeStatus
        planStripeTrialEnd
        requestIP
        schemaName
        state
        stripeId
        updatedAt
        updatedById
        website
        zip
      }
    }
  }
`;

// Partners Query
export const PARTNERS_QUERY = gql`
  query Users {
    users(filter: { roles: [PARTNER_ADMIN] }) {
      belongsToCompanyId
      createdAt
      deletedAt
      displayName
      email
      emailConfirmed
      firstName
      id
      lastName
      phone
      phoneConfirmed
      role
      twoFactorEnabled
      updatedAt
    }
  }
`;

export const GET_TICKETING_QUERY = gql`
 query Tickets {
    tickets(status: null, category: null) {
        id
        short_code
        parent_ticket
        company_id
        created_by
        title
        description
        priority
        category
        sub_category
        status
        estimated_time
        start_date
        end_date
        assigned_to
        assigned_by
        assigned_at
        resolved_at
        closed_at
        created_at
        updated_at
        deleted_at
    }
}
`;

export const AI_ADDONS_QUERY = gql`
  query GetAIAddons {
  aiAddons {
    id
    name
    description
    pricingType
    amount
    currency
    interval
    intervalCount
    creditPoolSize
     stripeProductId
        stripePriceId
        eligiblePlanIds
    active
    type
    credits
     createdAt
        updatedAt
        deletedAt
  }
}
`;

// ==================== Master Data Queries ====================

export const MASTER_ASSET_CATEGORIES_QUERY = gql`
  query MasterAssetCategories {
    masterAssetCategories {
      id
      name
      description
      icon_name
      icon_color
      icon_type
      is_default
      created_at
      updated_at
    }
  }
`;

export const MASTER_ASSET_PART_FIELDS_QUERY = gql`
  query MasterAssetPartFields($asset_part_id: ID) {
    masterAssetPartFields(asset_part_id: $asset_part_id) {
      id
      asset_part_id
      parent_id
      field_name
      field_type
      allowed_values
      is_required
      display_order
      show_in_panel
      created_at
      updated_at
    }
  }
`;

export const MASTER_ASSET_PARTS_QUERY = gql`
  query MasterAssetParts($asset_type_id: ID) {
    masterAssetParts(asset_type_id: $asset_type_id) {
      id
      name
      description
      asset_type_id
      created_at
      updated_at
    }
  }
`;

export const MASTER_ASSET_SERVICE_TYPES_QUERY = gql`
  query MasterAssetServiceTypes {
    masterAssetServiceTypes {
      id
      name
      description
      asset_category_ids
      created_at
      updated_at
    }
  }
`;

export const MASTER_ASSET_TYPE_FIELDS_QUERY = gql`
  query MasterAssetTypeFields($asset_type_id: ID) {
    masterAssetTypeFields(asset_type_id: $asset_type_id) {
      id
      asset_type_id
      parent_field_id
      field_name
      field_type
      allowed_values
      is_required
      display_order
      show_in_panel
      created_at
      updated_at
    }
  }
`;

export const MASTER_ASSET_TYPES_QUERY = gql`
  query MasterAssetTypes($asset_category_id: ID) {
    masterAssetTypes(asset_category_id: $asset_category_id) {
      id
      name
      description
      asset_category_id
      is_default
      icon_name
      icon_color
      icon_type
      created_at
      updated_at
    }
  }
`;

export const MASTER_MANUFACTURERS_QUERY = gql`
  query MasterManufacturers {
    masterManufacturers {
      id
      name
      description
      company_name
      phone_number
      country_code
      contact_person
      created_at
      updated_at
    }
  }
`;

export const MASTER_VENDORS_QUERY = gql`
  query MasterVendors {
    masterVendors {
      id
      name
      description
      company_id
      company_name
      phone_number
      country_code
      vendor_type
      can_login
      invited_by_user
      created_at
      updated_at
    }
  }
`;







// Assets Query
export const ASSETS_QUERY = gql`
  query Assets {
    assets {
      assetTypeId
      createdAt
      createdById
      deletedAt
      deletedById
      description
      fileIds
      id
      locationId
      maintenanceIds
      manufacturerId
      name
      position
      status
      updatedAt
      updatedById
      userIds
      vendorId
      assetSops {
        approvedAt
        approvedById
        assetId
        createdAt
        createdById
        deletedAt
        deletedById
        description
        documentPath
        documentType
        effectiveDate
        expiryDate
        fileSize
        id
        name
        status
        updatedAt
        updatedById
        version
      }
      assetFieldValues {
        assetFieldId
        assetId
        createdAt
        deletedAt
        id
        updatedAt
        value
        assetField {
          assetTypeId
          createdAt
          deletedAt
          description
          id
          label
          order
          required
          selectOptions
          type
          unit
          updatedAt
        }
      }
      assetMaintenanceSchedules {
        assetId
        createdAt
        deletedAt
        description
        endTime
        id
        intervalType
        intervalValue
        name
        remindBeforeType
        remindBeforeValue
        startTime
        timezone
        updatedAt
      }
      assetUsers {
        assetId
        createdAt
        deletedAt
        id
        updatedAt
        userId
      }
      location {
        address1
        address2
        city
        coordinates
        countryAlpha2
        createdAt
        deletedAt
        description
        fileId
        id
        name
        parentId
        state
        sublocation
        type
        updatedAt
        zip
      }
    }
  }
`;

// Work Orders  Query
export const WORK_ORDERS_QUERY = gql`query Workorders {
  workorders {
      createdAt
      createdById
      deletedAt
      deletedById
      description
      endTime
      id
      key
      locationId
      parentId
      pocUserIds
      serviceCategoryId
      severity
      startTime
      timezone
      title
      updatedAt
      updatedById
      workOrderStageId
      workOrderTypeId
      assetWorkOrders {
          assetId
          comment
          createdAt
          deletedAt
          id
          serviceTypeId
          subLocationId
          updatedAt
          workOrderId
          assetPlans {
              assetWorkOrderId
              comment
              createdAt
              deletedAt
              description
              id
              itemId
              name
              planId
              sublocation
              type
              updatedAt
          }
      }
      workOrderStage {
          color
          createdAt
          deletedAt
          id
          isDefault
          name
          updatedAt
      }
      location {
          address1
          address2
          city
          coordinates
          countryAlpha2
          createdAt
          deletedAt
          description
          fileId
          id
          name
          parentId
          state
          sublocation
          type
          updatedAt
          zip
          assets {
              assetTypeId
              config
              createdAt
              createdById
              deletedAt
              deletedById
              description
              fileIds
              id
              locationId
              maintenanceIds
              manufacturerId
              name
              position
              status
              updatedAt
              updatedById
              userIds
              vendorId
              assetFieldValues {
                  assetFieldId
                  assetId
                  createdAt
                  deletedAt
                  id
                  updatedAt
                  value
                  assetField {
                      assetTypeId
                      createdAt
                      deletedAt
                      description
                      id
                      label
                      order
                      required
                      selectOptions
                      type
                      unit
                      updatedAt
                  }
              }
              assetMaintenanceSchedules {
                  assetId
                  createdAt
                  deletedAt
                  description
                  endTime
                  id
                  intervalType
                  intervalValue
                  name
                  remindBeforeType
                  remindBeforeValue
                  startTime
                  timezone
                  updatedAt
              }
              assetSops {
                  approvedAt
                  approvedById
                  assetId
                  createdAt
                  createdById
                  deletedAt
                  deletedById
                  description
                  documentPath
                  documentType
                  effectiveDate
                  expiryDate
                  fileSize
                  id
                  name
                  status
                  updatedAt
                  updatedById
                  version
              }
              assetUsers {
                  assetId
                  createdAt
                  deletedAt
                  id
                  updatedAt
                  userId
              }
              location {
                  address1
                  address2
                  city
                  coordinates
                  countryAlpha2
                  createdAt
                  deletedAt
                  description
                  fileId
                  id
                  name
                  parentId
                  state
                  sublocation
                  type
                  updatedAt
                  zip
                  file {
                      belongsToId
                      belongsToType
                      createdAt
                      deletedAt
                      description
                      fileSize
                      folderId
                      id
                      name
                      path
                      type
                      updatedAt
                  }
              }
          }
          file {
              belongsToId
              belongsToType
              createdAt
              deletedAt
              description
              fileSize
              folderId
              id
              name
              path
              type
              updatedAt
          }
      }
  }
}

`;



// ==================== ==================== Master Data Mutations ==================== ==================== 
// Manufacturers Query
export const MANUFACTURERS_QUERY = gql`
  query MasterManufacturers {
    masterManufacturers {
        id
        name
        email
        company_name
        website
        address
        phone_number
        country_code
        contact_person
    }
}
`;

// Vendors Query
export const VENDORS_QUERY = gql`
  query MasterVendors {
    masterVendors {
        id
        company_name
        website
        email
        name
        phone_number
        country_code
        vendor_type
        can_login
        invited_by_user
        created_at
        updated_at
    }
}
`;


// Asset Categories Query
export const ASSET_CATEGORIES_QUERY = gql`
  query MasterAssetCategories {
    masterAssetCategories {
        id
        name
        description
        icon_name
        icon_color
        icon_type
        is_default
        created_at
        updated_at
    }
}
`;


export const WORKORDER_STAGES_QUERY = gql`query WorkOrderStages {
  workOrderStages {
      id
      company_id
      name
      color_code
      is_default
      display_order
      created_at
      updated_at
      colorCode
      isDefault
      displayOrder
      createdAt
      updatedAt
      deletedAt
  }
}`;

export const WORKORDER_TYPES_QUERY = gql`query WorkOrderTypes {
  workOrderTypes {
      id
      company_id
      name
      created_at
      updated_at
      description
      createdAt
      updatedAt
      deletedAt
  }
}`;

// Work Order Types Query
export const SERVICE_TYPE_QUERY = gql`query MasterAssetServiceTypes {
    masterAssetServiceTypes {
        id
        name
        asset_category_ids
        description
    }
}
`;
// Work Order Service Categories Query
export const SERVICE_CATEGORIES_QUERY = gql`query Workorderservicecategories {
  workorderservicecategories {
      createdAt
      deletedAt
      id
      name
      updatedAt
  }
}`;

// Service Categories Query
export const ASSIGNMENTS_TYPES_QUERY = gql`query Workorderassignments {
  workorderassignments {
      assignmentType
      createdAt
      deletedAt
      id
      updatedAt
      userId
      workOrderId
  }
}`;

// Asset Types Query
export const ASSET_TYPES_QUERY = gql`
  query MasterAssetTypes($asset_category_id: ID) {
    masterAssetTypes(asset_category_id: $asset_category_id) {
      id
      asset_category_id
      name
      description
      icon_name
      icon_color
      icon_type
      is_default
    }
  }
`;
// Asset Parts Query
export const ASSET_PARTS_QUERY = gql`
    query MasterAssetParts {
    masterAssetParts {
        id
        name
        description
        asset_type_id
        created_at
        updated_at
    }
}
`;

// Asset Part Fields Query
export const ASSET_PART_FIELDS_QUERY = gql`
    query MasterAssetPartFields($asset_part_id: ID) {
        masterAssetPartFields(asset_part_id: $asset_part_id) {
            id
            parent_id
            asset_part_id
            field_name
            description
            field_type
            allowed_values
            unit
            is_required
            display_order
            show_in_panel
        }
    }
`;

// Asset Fields Query
export const ASSET_FIELDS_QUERY = gql`
  query MasterAssetTypeFields($asset_type_id: ID) {
    masterAssetTypeFields(asset_type_id: $asset_type_id) {
      id
      asset_type_id
      field_type
      field_name
      allowed_values
      unit
      is_required
      display_order
      parent_field_id
      show_in_panel
      created_at
      updated_at
    }
  }
`;

export const PLANS_QUERY = gql`
  query Plans {
    plans {
      id
      name
      description
      amount
      currency
      interval
      interval_count
      features
      limits
      active
      is_default
      prorata_amount
      stripe_product_id
      stripe_price_id
      created_at
      updated_at
      deleted_at
    }
  }
`;