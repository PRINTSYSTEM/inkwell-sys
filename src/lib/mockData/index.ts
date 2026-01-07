/**
 * MockData Central Export
 * Consolidated exports for all mock data, services, and configurations
 */

// ===== DATA ENTITIES =====
// export * from "./data/users"; // TODO: File not found, needs to be created
export * from "./data/inventory";
export * from "./data/attendance";
export * from "./data/notifications";
export * from "./data/payments";
export * from "./data/production";
export * from "./data/prepress";

// ===== CONFIGURATIONS =====
export * from "./config/designTypes";
export * from "./config/status";
// export * from "./config/permissions"; // TODO: File not found, needs to be created

// ===== BACKWARD COMPATIBILITY ALIASES =====
// export { mockUsers as users } from "./data/users"; // TODO: File not found
export { mockPayments as payments } from "./data/payments";
export { mockProductions as productions } from "./data/production";

// ===== CURRENT USER =====
// export { currentUser } from "./data/users"; // TODO: File not found

// ===== MOCKS =====
