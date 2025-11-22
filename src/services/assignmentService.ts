// Backwards-compatible re-export for migrated API
export * from '@/apis/assignment.api';

// Also export the legacy names expected by consumers
export { AssignmentManagementService } from '@/apis/assignment.api';
export { assignmentApi as assignmentService } from '@/apis/assignment.api';