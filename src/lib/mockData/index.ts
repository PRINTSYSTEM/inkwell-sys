/**
 * MockData Central Export
 * Consolidated exports for all mock data, services, and configurations
 */

// ===== DATA ENTITIES =====
export * from './data/users';
export * from './data/customers';
export * from './data/orders';
export * from './data/designs';
export * from './data/inventory';
export * from './data/attendance';
export * from './data/notifications';
export * from './data/payments';
export * from './data/production';
export * from './data/prepress';

// ===== SERVICES =====
export * from './services/designService';
export * from './services/designTypesService';
export * from '../../services/materialService';

// ===== CONFIGURATIONS =====
export * from './config/designTypes';
export * from './config/status';
export * from './config/permissions';

// ===== BACKWARD COMPATIBILITY ALIASES =====
export { mockUsers as users } from './data/users';
export { mockCustomers as customers } from './data/customers';
export { mockOrders as orders } from './data/orders';
export { mockPayments as payments } from './data/payments';
export { mockProductions as productions } from './data/production';

// ===== CURRENT USER =====
export { currentUser } from './data/users';