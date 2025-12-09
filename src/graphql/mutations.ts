import { gql } from "@apollo/client";

// Login Mutation
export const LOGIN_MUTATION = gql`mutation Login($input: LoginInput!) {
    login(input: $input) {
        accessToken
        refreshToken
        user {
          id
          email
          firstName
          lastName
          role
          schema
        }
    }
}`;

// Forgot Password Mutation (Request Password Reset)
export const FORGOT_PASSWORD_MUTATION = gql`
  mutation RequestPasswordReset($input: ResetPasswordRequestInput!) {
    requestPasswordReset(input: $input)
  }
`;

// Reset Password Mutation
export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`;

// Company Signup Mutation (creates tenant company with schema)
export const SIGNUP_MUTATION = gql`
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      accessToken
      refreshToken
      user {
      id
      email
      firstName
      lastName
        role
        companyId
        schema
      }
    }
  }
`;

export const CREATE_COMPANY_MUTATION = gql`
  mutation CompanySignup($input: SignupInput!) {
    signup(input: $input) {
      accessToken
    }
  }
`
export const CREATE_PARTNER_MUTATION = gql`
  mutation PartnerSignup($input: PartnerSignupInput!) {
    partnerSignup(input: $input) {
      accessToken
    }
  }
`;

export const UPDATE_COMPANY_MUTATION = gql`
  mutation UpdateCompany($input: UpdateCompanyInput!) {
    updateCompany(input: $input) {
     id
    name
    email
    address
    city
    state
    country
    zip
    phoneNumber
    }
  }
`;

export const DELETE_COMPANY_MUTATION = gql`
  mutation DeleteCompany($id: ID!) {
    deleteCompany(id: $id)
  }
`;

export const UPDATE_COMPANY_USER_MUTATION = gql`
mutation UpdateCompanyUser($input: UpdateCompanyUserInput!) {
updateCompanyUser(input: $input) {
    id
    email
    firstName
    role
    lastName    
}
}
`;

export const DELETE_COMPANY_USER_MUTATION = gql`
  mutation DeleteCompanyUser($userId: ID!) {
    deleteCompanyUser(userId: $userId)
  }
`;

// export const CREATE_USER_MUTATION = gql`
//   mutation CreateUser($input: CreateUserInput!) {
//     createUser(input: $input) {
//       belongsToCompanyId
//       createdAt
//       deletedAt
//       displayName
//       email
//       emailConfirmed
//       firstName
//       id
//       lastName
//       phone
//       phoneConfirmed
//       role
//       twoFactorEnabled
//       updatedAt
//     }
//   }
// `;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
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

export const REMOVE_USER_MUTATION = gql`
  mutation RemoveUser($id: ID!) {
    removeUser(id: $id)
  }
`;

export const UPDATE_TICKET_MUTATION = gql`
  mutation UpdateTicket($input: UpdateTicketInput!) {
    updateTicket(input: $input) {
      category
      description
      id
      priority
      status
      title
    }
  }
`;

export const CREATE_TICKET_MUTATION = gql`
  mutation CreateTicket($input: CreateTicketInput!) {
    createTicket(input: $input) {
      category
      description
      id
      priority
      status
      title
    }
  }
`;

export const ACCEPT_INVITATION_MUTATION = gql`
mutation AcceptInvitation($input: AcceptInvitationInput!) {
    acceptInvitation(input: $input) {
        accessToken
        refreshToken
        __typename
    }
}
`;


// Send Invitation Mutation (using backend API)
export const SEND_INVITATION_MUTATION = gql`
  mutation SendInvitation($input: SendInvitationInput!) {
    sendInvitation(input: $input) {
      id
      email
      role
    }
  }
`;

// Resend Invitation Mutation
export const RESEND_INVITATION_MUTATION = gql`
  mutation ResendInvitation($input: ResendInvitationInput!) {
    resendInvitation(input: $input){
      id
        email
        role
        status
        expiresAt
        }
  }
`;

export const CREATE_AI_ADDON_MUTATION = gql`
  mutation CreateAIAddon($input: CreateAIAddonInput!) {
    createAIAddon(input: $input) {
      id
      name
      description
      pricingType
      amount
      currency
      interval
      intervalCount
      creditPoolSize
      stripePriceId
      stripeProductId
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

export const UPDATE_AI_ADDON_MUTATION = gql`
  mutation UpdateAIAddon($input: UpdateAIAddonInput!) {
    updateAIAddon(input: $input) {
      id
      name
      description
      pricingType
      amount
      currency
      interval
      intervalCount
      creditPoolSize
      credits
      stripeProductId
      stripePriceId
      eligiblePlanIds
      active
      type
      createdAt
      updatedAt
      deletedAt
    }
  }
`;

export const DELETE_AI_ADDON_MUTATION = gql`
  mutation DeleteAIAddon($input: DeleteAIAddonInput!) {
    deleteAIAddon(input: $input) {
      success
      message
    }
  }
`;

// ==================== Master Data Mutations ====================

// Master Asset Categories
export const CREATE_MASTER_ASSET_CATEGORY_MUTATION = gql`
  mutation CreateMasterAssetCategory($input: CreateMasterAssetCategoryInput!) {
    createMasterAssetCategory(input: $input) {
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

export const UPDATE_MASTER_ASSET_CATEGORY_MUTATION = gql`
  mutation UpdateMasterAssetCategory($input: UpdateMasterAssetCategoryInput!) {
    updateMasterAssetCategory(input: $input) {
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

export const DELETE_MASTER_ASSET_CATEGORY_MUTATION = gql`
  mutation DeleteMasterAssetCategory($input: DeleteMasterAssetCategoryInput!) {
    deleteMasterAssetCategory(input: $input) {
      success
      message
    }
  }
`;



// Master Asset Parts
export const CREATE_MASTER_ASSET_PART_MUTATION = gql`
  mutation CreateMasterAssetPart($input: CreateMasterAssetPartInput!) {
    createMasterAssetPart(input: $input) {
      id
      name
      description
      asset_type_id
      created_at
      updated_at
    }
  }
`;

export const UPDATE_MASTER_ASSET_PART_MUTATION = gql`
  mutation UpdateMasterAssetPart($input: UpdateMasterAssetPartInput!) {
    updateMasterAssetPart(input: $input) {
      id
      name
      description
      asset_type_id
      created_at
      updated_at
    }
  }
`;

export const DELETE_MASTER_ASSET_PART_MUTATION = gql`
  mutation DeleteMasterAssetPart($input: DeleteMasterAssetPartInput!) {
    deleteMasterAssetPart(input: $input) {
      success
      message
    }
  }
`;

// Master Asset Service Types
export const CREATE_MASTER_ASSET_SERVICE_TYPE_MUTATION = gql`
  mutation CreateMasterAssetServiceType($input: CreateMasterAssetServiceTypeInput!) {
    createMasterAssetServiceType(input: $input) {
      id
      name
      description
      asset_category_ids
      created_at
      updated_at
    }
  }
`;

export const UPDATE_MASTER_ASSET_SERVICE_TYPE_MUTATION = gql`
  mutation UpdateMasterAssetServiceType($input: UpdateMasterAssetServiceTypeInput!) {
    updateMasterAssetServiceType(input: $input) {
      id
      name
      description
      asset_category_ids
      created_at
      updated_at
    }
  }
`;

export const DELETE_MASTER_ASSET_SERVICE_TYPE_MUTATION = gql`
  mutation DeleteMasterAssetServiceType($input: DeleteMasterAssetServiceTypeInput!) {
    deleteMasterAssetServiceType(input: $input) {
      success
      message
    }
  }
`;



// Master Asset Types
export const CREATE_MASTER_ASSET_TYPE_MUTATION = gql`
  mutation CreateMasterAssetType($input: CreateMasterAssetTypeInput!) {
    createMasterAssetType(input: $input) {
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

export const UPDATE_MASTER_ASSET_TYPE_MUTATION = gql`
  mutation UpdateMasterAssetType($input: UpdateMasterAssetTypeInput!) {
    updateMasterAssetType(input: $input) {
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

export const DELETE_MASTER_ASSET_TYPE_MUTATION = gql`
  mutation DeleteMasterAssetType($input: DeleteMasterAssetTypeInput!) {
    deleteMasterAssetType(input: $input) {
      success
      message
    }
  }
`;

// Master Manufacturers
export const CREATE_MASTER_MANUFACTURER_MUTATION = gql`
  mutation CreateMasterManufacturer($input: CreateMasterManufacturerInput!) {
    createMasterManufacturer(input: $input) {
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

export const UPDATE_MASTER_MANUFACTURER_MUTATION = gql`
  mutation UpdateMasterManufacturer($input: UpdateMasterManufacturerInput!) {
    updateMasterManufacturer(input: $input) {
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

export const DELETE_MASTER_MANUFACTURER_MUTATION = gql`
  mutation DeleteMasterManufacturer($input: DeleteMasterManufacturerInput!) {
    deleteMasterManufacturer(input: $input) {
      success
      message
    }
  }
`;

// Master Vendors
export const CREATE_MASTER_VENDOR_MUTATION = gql`
  mutation CreateMasterVendor($input: CreateMasterVendorInput!) {
    createMasterVendor(input: $input) {
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

export const UPDATE_MASTER_VENDOR_MUTATION = gql`
  mutation UpdateMasterVendor($input: UpdateMasterVendorInput!) {
    updateMasterVendor(input: $input) {
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

export const DELETE_MASTER_VENDOR_MUTATION = gql`
  mutation DeleteMasterVendor($input: DeleteMasterVendorInput!) {
    deleteMasterVendor(input: $input) {
      success
      message
    }
  }
`;


// Register Mutation (for Partner Admin signup)






// ==================== ==================== Master Data Mutations ==================== ==================== 

// Create Manufacturer Mutation
export const CREATE_MANUFACTURER_MUTATION = gql`
    mutation CreateMasterManufacturer($input: CreateMasterManufacturerInput!) {
        createMasterManufacturer(input: $input) {
            id
            name
            email
            company_name
            website
            address
            phone_number
            country_code
            contact_person
            created_at
            updated_at
        }
    }
`;

// Update Manufacturer Mutation
export const UPDATE_MANUFACTURER_MUTATION = gql`
    mutation UpdateMasterManufacturer($input: UpdateMasterManufacturerInput!) {
        updateMasterManufacturer(input: $input) {
            id
            name
            email
            company_name
            website
            address
            phone_number
            country_code
            contact_person
            created_at
            updated_at
        }
    }
`;

// Delete Manufacturer Mutation
export const DELETE_MANUFACTURER_MUTATION = gql`
    mutation DeleteMasterManufacturer($id: ID!) {
        deleteMasterManufacturer(input: { id: $id }) {
            success
            message
        }
    }
`;



// Create Vendor Mutation
export const CREATE_VENDOR_MUTATION = gql`
    mutation CreateMasterVendor($input: CreateMasterVendorInput!) {
        createMasterVendor(input: $input) {
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

// Update Vendor Mutation
export const UPDATE_VENDOR_MUTATION = gql`
    mutation UpdateMasterVendor($input: UpdateMasterVendorInput!) {
        updateMasterVendor(input: $input) {
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

// Delete Vendor Mutation
export const DELETE_VENDOR_MUTATION = gql`
    mutation DeleteMasterVendor($id: ID!) {
        deleteMasterVendor(input: { id: $id }) {
            success
            message
        }
    }
`;

// Create Asset Category Mutation
export const CREATE_ASSET_CATEGORY_MUTATION = gql`
    mutation CreateMasterAssetCategory($input: CreateMasterAssetCategoryInput!) {
        createMasterAssetCategory(input: $input) {
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

// Update Asset Category Mutation
export const UPDATE_ASSET_CATEGORY_MUTATION = gql`
    mutation UpdateMasterAssetCategory($input: UpdateMasterAssetCategoryInput!) {
        updateMasterAssetCategory(input: $input) {
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

// Delete Asset Category Mutation
export const DELETE_ASSET_CATEGORY_MUTATION = gql`
    mutation DeleteMasterAssetCategory($id: ID!) {
        deleteMasterAssetCategory(input: { id: $id }) {
            success
            message
        }
    }
`;



// Create Work Order Stage Mutation
export const CREATE_WORK_ORDER_STAGE_MUTATION = gql`
    mutation CreateWorkOrderStage($input: CreateWorkOrderStageInput!) {
        createWorkOrderStage(input: $input) {
            color
            createdAt
            deletedAt
            id
            isDefault
            name
            updatedAt
        }
    }
`;

// Update Work Order Stage Mutation
export const UPDATE_WORK_ORDER_STAGE_MUTATION = gql`
    mutation UpdateWorkOrderStage($input: UpdateWorkOrderStageInput!) {
        updateWorkOrderStage(input: $input) {
            color
            createdAt
            deletedAt
            id
            isDefault
            name
            updatedAt
        }
    }
`;

// Delete Work Order Stage Mutation
export const DELETE_WORK_ORDER_STAGE_MUTATION = gql`
    mutation RemoveWorkOrderStage($id: ID!) {
        removeWorkOrderStage(id: $id)
    }
`;

// Create Service Type Mutation
export const CREATE_SERVICE_TYPE_MUTATION = gql`
    mutation CreateMasterAssetServiceType($input: CreateMasterAssetServiceTypeInput!) {
        createMasterAssetServiceType(input: $input) {
            id
            name
            asset_category_ids
            description
            created_at
            updated_at
        }
    }
`;

// Update Service Type Mutation
export const UPDATE_SERVICE_TYPE_MUTATION = gql`
    mutation UpdateMasterAssetServiceType($input: UpdateMasterAssetServiceTypeInput!) {
        updateMasterAssetServiceType(input: $input) {
            id
            name
            asset_category_ids
            description
            created_at
            updated_at
        }
    }
`;

// Delete Service Type Mutation
export const DELETE_SERVICE_TYPE_MUTATION = gql`
    mutation DeleteMasterAssetServiceType($id: ID!) {
        deleteMasterAssetServiceType(input: { id: $id }) {
            success
            message
        }
    }
`;

// Create Work Order Type Mutation
export const CREATE_WORK_ORDER_TYPE_MUTATION = gql`
    mutation CreateMasterWorkOrderType($input: CreateMasterWorkOrderTypeInput!) {
        createMasterWorkOrderType(input: $input) {
            id
            company_id
            name
            description
            created_at
            updated_at
            createdAt
            updatedAt
            deletedAt
        }
    }
`;

// Update Work Order Type Mutation
export const UPDATE_WORK_ORDER_TYPE_MUTATION = gql`
    mutation UpdateMasterWorkOrderType($input: UpdateMasterWorkOrderTypeInput!) {
        updateMasterWorkOrderType(input: $input) {
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
    }
`;

// Delete Work Order Type Mutation
export const DELETE_WORK_ORDER_TYPE_MUTATION = gql`
    mutation DeleteMasterWorkOrderType($input: DeleteMasterWorkOrderTypeInput!, $id: ID) {
        deleteMasterWorkOrderType(input: $input, id: $id) {
            success
            message
        }
    }
`;

// Create Service Category Mutation
export const CREATE_SERVICE_CATEGORY_MUTATION = gql`
    mutation CreateWorkOrderServiceCategory($input: CreateWorkOrderServiceCategoryInput!) {
        createWorkOrderServiceCategory(input: $input) {
            createdAt
            deletedAt
            id
            name
            updatedAt
        }
    }
`;

// Update Service Category Mutation
export const UPDATE_SERVICE_CATEGORY_MUTATION = gql`
    mutation UpdateWorkOrderServiceCategory($input: UpdateWorkOrderServiceCategoryInput!) {
        updateWorkOrderServiceCategory(input: $input) {
            createdAt
            deletedAt
            id
            name
            updatedAt
        }
    }
`;

// Delete Service Category Mutation
export const DELETE_SERVICE_CATEGORY_MUTATION = gql`
    mutation RemoveWorkOrderServiceCategory($id: ID!) {
        removeWorkOrderServiceCategory(id: $id)
    }
`;

// Create Assignment Mutation
export const CREATE_ASSIGNMENT_MUTATION = gql`
    mutation CreateWorkOrderAssignment($input: CreateWorkOrderAssignmentInput!) {
        createWorkOrderAssignment(input: $input) {
            assignmentType
            createdAt
            deletedAt
            id
            updatedAt
            userId
            workOrderId
        }
    }
`;

// Update Assignment Mutation
export const UPDATE_ASSIGNMENT_MUTATION = gql`
    mutation updateWorkOrderAssignment($input: UpdateWorkOrderAssignmentInput!) {
        updateWorkOrderAssignment(input: $input) {
            assignmentType
            createdAt
            deletedAt
            id
            updatedAt
            userId
            workOrderId
        }
    }
`;

// Delete Assignment Mutation
export const DELETE_ASSIGNMENT_MUTATION = gql`
    mutation RemoveWorkOrderAssignment($id: ID!) {
        removeWorkOrderAssignment(id: $id)
    }
`;

// Create Asset Type Mutation
export const CREATE_ASSET_TYPE_MUTATION = gql`
    mutation CreateMasterAssetType($input: CreateMasterAssetTypeInput!) {
        createMasterAssetType(input: $input) {
            id
            asset_category_id
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

// Update Asset Type Mutation
export const UPDATE_ASSET_TYPE_MUTATION = gql`
    mutation UpdateMasterAssetType($input: UpdateMasterAssetTypeInput!) {
        updateMasterAssetType(input: $input) {
            id
            asset_category_id
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

// Delete Asset Type Mutation
export const DELETE_ASSET_TYPE_MUTATION = gql`
    mutation DeleteMasterAssetType($id: ID!) {
        deleteMasterAssetType(input: { id: $id }) {
            success
            message
        }
    }
`;

// Create Asset Part Mutation
export const CREATE_ASSET_PART_MUTATION = gql`
    mutation CreateMasterAssetPart($input: CreateMasterAssetPartInput!) {
        createMasterAssetPart(input: $input) {
            id
            name
            description
            asset_type_id
            created_at
            updated_at
        }
    }
`;

// Update Asset Part Mutation
export const UPDATE_ASSET_PART_MUTATION = gql`
    mutation UpdateMasterAssetPart($input: UpdateMasterAssetPartInput!) {
        updateMasterAssetPart(input: $input) {
            id
            name
            description
            asset_type_id
            created_at
            updated_at
        }
    }
`;

// Remove Asset Part Mutation
export const REMOVE_ASSET_PART_MUTATION = gql`
    mutation DeleteMasterAssetPart($id: ID!) {
        deleteMasterAssetPart(input: { id: $id }) {
            success
            message
        }
    }
`;
// Master Asset Part Fields
export const CREATE_ASSET_PART_FIELD_MUTATION = gql`
  mutation CreateMasterAssetPartField($input: CreateMasterAssetPartFieldInput!) {
    createMasterAssetPartField(input: $input) {
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
      created_at
      updated_at
    }
  }
`;

export const UPDATE_ASSET_PART_FIELD_MUTATION = gql`
  mutation UpdateMasterAssetPartField($input: UpdateMasterAssetPartFieldInput!) {
    updateMasterAssetPartField(input: $input) {
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
      created_at
      updated_at
    }
  }
`;

export const DELETE_ASSET_PART_FIELD_MUTATION = gql`
  mutation DeleteMasterAssetPartField($id: ID!) {
    deleteMasterAssetPartField(input: { id: $id }) {
      success
      message
    }
  }
`;
// Master Asset Type Fields
export const CREATE_ASSET_TYPE_FIELD_MUTATION = gql`
  mutation CreateMasterAssetTypeField($input: CreateMasterAssetTypeFieldInput!) {
    createMasterAssetTypeField(input: $input) {
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
    }
  }
`;

export const UPDATE_ASSET_TYPE_FIELD_MUTATION = gql`
  mutation UpdateMasterAssetTypeField($input: UpdateMasterAssetTypeFieldInput!) {
    updateMasterAssetTypeField(input: $input) {
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

export const DELETE_ASSET_TYPE_FIELD_MUTATION = gql`
  mutation DeleteMasterAssetTypeField($id: ID!) {
    deleteMasterAssetTypeField(input: { id: $id }) {
      success
      message
    }
  }
`;

// ==================== Plan Mutations ====================

export const CREATE_PLAN_MUTATION = gql`
  mutation CreatePlan($input: CreatePlanInput!) {
    createPlan(input: $input) {
      id
      name
      description
      amount
      currency
      interval
      interval_count
      features
      limits
      is_default
      prorata_amount
      active
      stripe_product_id
      stripe_price_id
      created_at
      updated_at
    }
  }
`;

export const UPDATE_PLAN_MUTATION = gql`
  mutation UpdatePlan($input: UpdatePlanInput!) {
    updatePlan(input: $input) {
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
      updated_at
    }
  }
`;

export const DELETE_PLAN_MUTATION = gql`
  mutation DeletePlan($input: DeletePlanInput!) {
    deletePlan(input: $input) {
      success
      message
    }
  }
`;

