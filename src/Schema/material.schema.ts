import { z } from 'zod';
import { StatusEnum, PriorityEnum } from './Common/enums';
import { IdSchema, DateSchema } from './Common/base';

// Material Category Enum
export const MaterialCategoryEnum = z.enum([
  'paper',
  'cardboard',
  'vinyl',
  'fabric',
  'plastic',
  'metal',
  'wood',
  'glass',
  'rubber',
  'adhesive',
  'ink',
  'toner',
  'coating',
  'finishing_material',
  'packaging',
  'hardware',
  'chemical',
  'other'
]);

// Material Unit Enum
export const MaterialUnitEnum = z.enum([
  'sheet',
  'roll',
  'pack',
  'box',
  'piece',
  'meter',
  'yard',
  'kg',
  'gram',
  'liter',
  'ml',
  'can',
  'bottle',
  'tube',
  'cartridge'
]);

// Material Quality Grade Enum
export const MaterialQualityEnum = z.enum([
  'premium',
  'standard',
  'economy',
  'recycled',
  'eco_friendly'
]);

// Material Properties Schema
export const MaterialPropertiesSchema = z.object({
  weight: z.number().positive().optional(),
  thickness: z.number().positive().optional(),
  dimensions: z.object({
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    length: z.number().positive().optional(),
    unit: z.enum(['mm', 'cm', 'inch']).default('mm')
  }).optional(),
  
  // Paper specific properties
  gsm: z.number().positive().optional(),
  finish: z.enum(['gloss', 'matte', 'satin', 'uncoated']).optional(),
  opacity: z.number().min(0).max(100).optional(),
  brightness: z.number().min(0).max(100).optional(),
  
  // Print properties
  printable: z.boolean().default(true),
  colorCapability: z.enum(['full_color', 'black_white', 'spot_color']).optional(),
  printMethods: z.array(z.enum(['digital', 'offset', 'screen', 'flexo'])).default([]),
  
  // Environmental
  recyclable: z.boolean().default(false),
  biodegradable: z.boolean().default(false),
  fscCertified: z.boolean().default(false),
  
  // Storage
  temperatureRange: z.object({
    min: z.number(),
    max: z.number(),
    unit: z.enum(['celsius', 'fahrenheit']).default('celsius')
  }).optional(),
  humidityRange: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100)
  }).optional(),
  
  // Safety
  hazardous: z.boolean().default(false),
  safetyNotes: z.string().optional(),
  
  // Additional properties
  custom: z.record(z.unknown()).optional()
});

// Supplier Schema
export const SupplierSchema = z.object({
  id: IdSchema,
  name: z.string(),
  code: z.string().optional(),
  
  // Contact Info
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  
  // Address
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string()
  }).optional(),
  
  // Business Info
  taxId: z.string().optional(),
  businessLicense: z.string().optional(),
  
  // Performance
  rating: z.number().min(1).max(5).optional(),
  qualityScore: z.number().min(0).max(100).optional(),
  deliveryScore: z.number().min(0).max(100).optional(),
  
  // Terms
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  minimumOrder: z.number().min(0).optional(),
  
  // Status
  isActive: z.boolean().default(true),
  isPreferred: z.boolean().default(false),
  
  createdAt: DateSchema,
  updatedAt: DateSchema
});

// Material Schema
export const MaterialSchema = z.object({
  id: IdSchema,
  code: z.string().regex(/^MAT-\d{4}-\d{6}$/, "Material code must follow format MAT-YYYY-XXXXXX"),
  
  // Basic Info
  name: z.string(),
  description: z.string().optional(),
  category: MaterialCategoryEnum,
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  
  // Identification
  sku: z.string().optional(),
  barcode: z.string().optional(),
  manufacturerPartNumber: z.string().optional(),
  
  // Physical Properties
  properties: MaterialPropertiesSchema,
  quality: MaterialQualityEnum,
  
  // Packaging
  unit: MaterialUnitEnum,
  unitsPerPackage: z.number().positive().default(1),
  packageDimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    length: z.number().positive(),
    weight: z.number().positive(),
    unit: z.enum(['mm', 'cm', 'inch']).default('cm')
  }).optional(),
  
  // Suppliers
  suppliers: z.array(z.object({
    supplierId: IdSchema,
    supplierCode: z.string().optional(),
    unitPrice: z.number().min(0),
    currency: z.string().default('VND'),
    minimumQuantity: z.number().min(0).default(1),
    leadTime: z.number().min(0), // days
    isPrimary: z.boolean().default(false),
    lastUpdated: DateSchema
  })).default([]),
  
  // Inventory Settings
  reorderPoint: z.number().min(0).default(0),
  maxStock: z.number().min(0).optional(),
  safetyStock: z.number().min(0).default(0),
  
  // Costs
  standardCost: z.number().min(0).optional(),
  lastCost: z.number().min(0).optional(),
  averageCost: z.number().min(0).optional(),
  
  // Status
  status: StatusEnum,
  isActive: z.boolean().default(true),
  isConsumable: z.boolean().default(true),
  
  // Compliance
  certifications: z.array(z.string()).default([]),
  msdsUrl: z.string().url().optional(),
  
  // Images & Documents
  images: z.array(z.string().url()).default([]),
  documents: z.array(z.object({
    name: z.string(),
    type: z.enum(['spec_sheet', 'msds', 'certificate', 'manual', 'other']),
    url: z.string().url()
  })).default([]),
  
  // Analytics
  usageFrequency: z.enum(['high', 'medium', 'low']).optional(),
  lastUsed: DateSchema.optional(),
  totalConsumed: z.number().min(0).default(0),
  
  // Metadata
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: IdSchema
});

// Inventory Transaction Schema
export const InventoryTransactionSchema = z.object({
  id: IdSchema,
  materialId: IdSchema,
  
  // Transaction Details
  type: z.enum(['in', 'out', 'adjustment', 'transfer', 'waste', 'return']),
  quantity: z.number(),
  unit: MaterialUnitEnum,
  
  // References
  referenceType: z.enum(['purchase_order', 'production_order', 'adjustment', 'transfer', 'waste_report', 'return']).optional(),
  referenceId: IdSchema.optional(),
  referenceNumber: z.string().optional(),
  
  // Cost
  unitCost: z.number().min(0).optional(),
  totalCost: z.number().optional(),
  
  // Location
  fromLocation: z.string().optional(),
  toLocation: z.string().optional(),
  
  // Reason & Notes
  reason: z.string().optional(),
  notes: z.string().optional(),
  
  // Approval
  approvedBy: IdSchema.optional(),
  approvedAt: DateSchema.optional(),
  
  createdAt: DateSchema,
  createdBy: IdSchema
});

// Inventory Level Schema
export const InventoryLevelSchema = z.object({
  materialId: IdSchema,
  location: z.string(),
  
  // Quantities
  currentStock: z.number().min(0),
  reservedStock: z.number().min(0).default(0),
  availableStock: z.number().min(0),
  
  // Costs
  averageCost: z.number().min(0).optional(),
  totalValue: z.number().min(0).optional(),
  
  // Dates
  lastRestocked: DateSchema.optional(),
  lastUpdated: DateSchema,
  
  // Status
  status: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'overstock']),
  needsReorder: z.boolean().default(false)
});

// Material Usage Schema
export const MaterialUsageSchema = z.object({
  id: IdSchema,
  materialId: IdSchema,
  
  // Usage Context
  usedInType: z.enum(['production_order', 'design_code', 'maintenance', 'sample', 'other']),
  usedInId: IdSchema.optional(),
  
  // Quantity
  quantityUsed: z.number().positive(),
  unit: MaterialUnitEnum,
  wastage: z.number().min(0).default(0),
  
  // Department & User
  department: z.string(),
  usedBy: IdSchema,
  
  // Timestamps
  usedAt: DateSchema,
  createdAt: DateSchema
});

// Material Statistics Schema
export const MaterialStatsSchema = z.object({
  period: z.object({
    start: DateSchema,
    end: DateSchema
  }),
  
  overview: z.object({
    total_materials: z.number().min(0),
    active_materials: z.number().min(0),
    low_stock_items: z.number().min(0),
    out_of_stock_items: z.number().min(0),
    total_inventory_value: z.number().min(0),
    total_consumption: z.number().min(0)
  }),
  
  by_category: z.array(z.object({
    category: MaterialCategoryEnum,
    count: z.number().min(0),
    value: z.number().min(0),
    consumption: z.number().min(0)
  })),
  
  top_consumed: z.array(z.object({
    materialId: IdSchema,
    materialName: z.string(),
    totalUsed: z.number().min(0),
    cost: z.number().min(0)
  })),
  
  low_stock_alerts: z.array(z.object({
    materialId: IdSchema,
    materialName: z.string(),
    currentStock: z.number().min(0),
    reorderPoint: z.number().min(0),
    daysUntilEmpty: z.number().min(0).optional()
  })),
  
  consumption_trends: z.array(z.object({
    date: DateSchema,
    consumption: z.number().min(0),
    cost: z.number().min(0)
  }))
});

// Create Material Schema
export const CreateMaterialSchema = MaterialSchema.omit({
  id: true,
  code: true,
  createdAt: true,
  updatedAt: true,
  lastUsed: true,
  totalConsumed: true
});

// Update Material Schema
export const UpdateMaterialSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  category: MaterialCategoryEnum.optional(),
  properties: MaterialPropertiesSchema.optional(),
  reorderPoint: z.number().min(0).optional(),
  maxStock: z.number().min(0).optional(),
  safetyStock: z.number().min(0).optional(),
  standardCost: z.number().min(0).optional(),
  status: StatusEnum.optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

// Material Filter Schema
export const MaterialFilterSchema = z.object({
  search: z.string().optional(),
  category: MaterialCategoryEnum.optional(),
  quality: MaterialQualityEnum.optional(),
  status: StatusEnum.optional(),
  isActive: z.boolean().optional(),
  supplierId: IdSchema.optional(),
  lowStock: z.boolean().optional(),
  outOfStock: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['name', 'category', 'createdAt', 'lastUsed', 'currentStock']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// Export types
export type MaterialCategory = z.infer<typeof MaterialCategoryEnum>;
export type MaterialUnit = z.infer<typeof MaterialUnitEnum>;
export type MaterialQuality = z.infer<typeof MaterialQualityEnum>;
export type MaterialProperties = z.infer<typeof MaterialPropertiesSchema>;
export type Supplier = z.infer<typeof SupplierSchema>;
export type Material = z.infer<typeof MaterialSchema>;
export type InventoryTransaction = z.infer<typeof InventoryTransactionSchema>;
export type InventoryLevel = z.infer<typeof InventoryLevelSchema>;
export type MaterialUsage = z.infer<typeof MaterialUsageSchema>;
export type MaterialStats = z.infer<typeof MaterialStatsSchema>;
export type CreateMaterial = z.infer<typeof CreateMaterialSchema>;
export type UpdateMaterial = z.infer<typeof UpdateMaterialSchema>;
export type MaterialFilter = z.infer<typeof MaterialFilterSchema>;