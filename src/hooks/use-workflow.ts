import { useState, useEffect, useCallback } from 'react';
import { workflowService } from '@/apis/workflow.api';
import type { WorkflowEvent } from '@/services/workflowService';

export function useWorkflow(orderId?: string) {
  const [workflowStatus, setWorkflowStatus] = useState<{
    order: string;
    design: string;
    production: string;
    payment: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (orderId) {
      setIsLoading(true);
      const status = workflowService.getWorkflowStatus(orderId);
      setWorkflowStatus(status);
      setIsLoading(false);
    }
  }, [orderId]);

  const triggerStatusChange = useCallback(async (
    type: WorkflowEvent['type'],
    orderId: string,
    oldStatus: string,
    newStatus: string
  ) => {
    const event: WorkflowEvent = {
      type,
      orderId,
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString()
    };

    await workflowService.processEvent(event);

    if (orderId) {
      const updatedStatus = workflowService.getWorkflowStatus(orderId);
      setWorkflowStatus(updatedStatus);
    }
  }, []);

  const getEventHistory = useCallback(() => workflowService.getEventHistory(), []);
  const getOrderEvents = useCallback((id: string) => workflowService.getEventsByOrder(id), []);

  return {
    workflowStatus,
    isLoading,
    triggerStatusChange,
    getEventHistory,
    getOrderEvents
  };
}

export default useWorkflow;
