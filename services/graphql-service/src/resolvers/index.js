const authResolvers = require("./auth");
const planResolvers = require("./plan");
const aiAddonResolvers = require("./aiaddons");
const ticketResolvers = require("./tickets");
const ticketCommentResolvers = require("./ticketComments");
const masterDataResolvers = require("./masterData");
const workOrderResolvers = require("./workOrder");
const locationResolvers = require("./location");
const locationManagementResolvers = require("./location-management");
const assetResolvers = require("./asset");
const fileResolvers = require("./file");
const aiServiceResolvers = require("./ai-service");
const companyAiConfigsResolvers = require("./company_ai_configs");
const companyPlansResolvers = require("./company_plans");
const aiaddonsResolvers = require("./aiaddons");
const maintenanceScheduleResolvers = require("./maintenanceSchedule");
const maintenanceActivityResolvers = require("./maintenanceActivity");
const assetSOPIncidentPlansResolvers = require("./asset_sops_incident_plans");
const assetMaintenanceScheduleResolvers = require("./asset_maintenance_schedules");
const enumResolvers = require("./enums");
const productCategoryResolvers = require("./productCategories");
const productTypeResolvers = require("./productTypes");
const productResolvers = require("./products");
const productMaintenanceScheduleResolvers = require("./productMaintenanceSchedules");
const masterDataRequestResolvers = require("./masterDataRequests");
const masterFAQResolvers = require("./masterFAQs");
const masterSOPIncidentPlanResolvers = require("./masterSOPIncidentPlans");
const productServiceTypeResolvers = require("./productServiceTypes");
const publicMasterVendorResolvers = require("./publicMasterVendors");

const resolvers = {
  // Scalar types
  ...(locationResolvers.JSON && { JSON: locationResolvers.JSON }),
  // Type resolvers
  ...(locationResolvers.Location || workOrderResolvers.Location
    ? {
      Location: {
        ...(locationResolvers.Location || {}),
        ...(workOrderResolvers.Location || {}),
      },
    }
    : {}),
  ...(workOrderResolvers.WorkOrder && {
    WorkOrder: workOrderResolvers.WorkOrder,
  }),
  ...(workOrderResolvers.WorkOrderAsset && {
    WorkOrderAsset: workOrderResolvers.WorkOrderAsset,
  }),
  ...(workOrderResolvers.WorkOrderAssignment && {
    WorkOrderAssignment: workOrderResolvers.WorkOrderAssignment,
  }),
  ...(assetResolvers.Asset || workOrderResolvers.Asset
    ? {
      Asset: {
        ...(assetResolvers.Asset || {}),
        ...(workOrderResolvers.Asset || {}),
      },
    }
    : {}),
  ...(assetResolvers.AssetPart && { AssetPart: assetResolvers.AssetPart }),
  ...(maintenanceScheduleResolvers.MaintenanceSchedule && { MaintenanceSchedule: maintenanceScheduleResolvers.MaintenanceSchedule }),
  ...(assetMaintenanceScheduleResolvers.AssetMaintenanceSchedule && { AssetMaintenanceSchedule: assetMaintenanceScheduleResolvers.AssetMaintenanceSchedule }),
  ...(productCategoryResolvers.ProductCategory && { ProductCategory: productCategoryResolvers.ProductCategory }),
  ...(productTypeResolvers.ProductType && { ProductType: productTypeResolvers.ProductType }),
  ...(productResolvers.Product && { Product: productResolvers.Product }),
  ...(productMaintenanceScheduleResolvers.ProductMaintenanceSchedule && { ProductMaintenanceSchedule: productMaintenanceScheduleResolvers.ProductMaintenanceSchedule }),
  ...(masterFAQResolvers.MasterFAQ && { MasterFAQ: masterFAQResolvers.MasterFAQ }),
  ...(masterSOPIncidentPlanResolvers.MasterSOPIncidentPlan && { MasterSOPIncidentPlan: masterSOPIncidentPlanResolvers.MasterSOPIncidentPlan }),
  ...(productServiceTypeResolvers.ProductServiceType && { ProductServiceType: productServiceTypeResolvers.ProductServiceType }),
  ...(masterDataRequestResolvers.MasterDataRequest && { MasterDataRequest: masterDataRequestResolvers.MasterDataRequest }),
  Query: {
    ...authResolvers.Query,
    ...planResolvers.Query,
    ...ticketResolvers.Query,
    ...ticketCommentResolvers.Query,
    ...masterDataResolvers.Query,
    ...locationResolvers.Query,
    ...locationManagementResolvers.Query,
    ...assetResolvers.Query,
    ...workOrderResolvers.Query,
    ...fileResolvers.Query,
    ...aiServiceResolvers.Query,
    ...companyAiConfigsResolvers.Query,
    ...companyPlansResolvers.Query,
    ...aiaddonsResolvers.Query,
    ...maintenanceScheduleResolvers.Query,
    ...maintenanceActivityResolvers.Query,
    ...assetSOPIncidentPlansResolvers.Query,
    ...assetMaintenanceScheduleResolvers.Query,
    ...enumResolvers.Query,
    ...productCategoryResolvers.Query,
    ...productTypeResolvers.Query,
    ...productResolvers.Query,
    ...productMaintenanceScheduleResolvers.Query,
    ...masterDataRequestResolvers.Query,
    ...masterFAQResolvers.Query,
    ...masterSOPIncidentPlanResolvers.Query,
    ...productServiceTypeResolvers.Query,
    ...publicMasterVendorResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...planResolvers.Mutation,
    ...ticketResolvers.Mutation,
    ...ticketCommentResolvers.Mutation,
    ...masterDataResolvers.Mutation,
    ...locationResolvers.Mutation,
    ...locationManagementResolvers.Mutation,
    ...assetResolvers.Mutation,
    ...workOrderResolvers.Mutation,
    ...fileResolvers.Mutation,
    ...aiServiceResolvers.Mutation,
    ...companyAiConfigsResolvers.Mutation,
    ...companyPlansResolvers.Mutation,
    ...aiaddonsResolvers.Mutation,
    ...maintenanceScheduleResolvers.Mutation,
    ...maintenanceActivityResolvers.Mutation,
    ...assetSOPIncidentPlansResolvers.Mutation,
    ...assetMaintenanceScheduleResolvers.Mutation,
    ...productCategoryResolvers.Mutation,
    ...productTypeResolvers.Mutation,
    ...productResolvers.Mutation,
    ...productMaintenanceScheduleResolvers.Mutation,
    ...masterDataRequestResolvers.Mutation,
    ...masterFAQResolvers.Mutation,
    ...masterSOPIncidentPlanResolvers.Mutation,
    ...productServiceTypeResolvers.Mutation,
    ...publicMasterVendorResolvers.Mutation,
  },
};

module.exports = resolvers;
