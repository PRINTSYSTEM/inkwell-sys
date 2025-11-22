/**
 * MockData Central Export
 * Consolidated exports for all mock data, services, and configurations
 */

// ===== DATA ENTITIES =====
export * from './data/users';
export * from './data/inventory';
export * from './data/attendance';
export * from './data/notifications';
export * from './data/payments';
export * from './data/production';
export * from './data/prepress';

// ===== SERVICES =====
export * from '../../services/materialService';
export { default as designService } from '../../apis/design.api';

// ===== CONFIGURATIONS =====
export * from './config/designTypes';
export * from './config/status';
export * from './config/permissions';

// ===== BACKWARD COMPATIBILITY ALIASES =====
export { mockUsers as users } from './data/users';
export { mockPayments as payments } from './data/payments';
export { mockProductions as productions } from './data/production';

// ===== CURRENT USER =====
export { currentUser } from './data/users';

// ===== MOCKS =====
// Minimal mock designs for UI pages that expect `mockDesigns`
export const mockDesigns = [
	{
		id: 'design_1',
		orderNumber: 'ORD-1001',
		customerName: 'Khách hàng A',
		status: 'in_progress',
		notes: 'Phiên bản thử nghiệm',
		files: [
			{ id: 'file_1', name: 'design_v1.pdf', uploadedAt: new Date().toISOString(), uploadedBy: 'user_1' }
		],
		updatedAt: new Date().toISOString()
	}
];