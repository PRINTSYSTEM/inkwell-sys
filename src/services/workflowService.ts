// Workflow Service - Manages connections between modules
// Order → Design → Production → Payment

export interface WorkflowEvent {
  type: 'order_status_change' | 'production_status_change' | 'payment_status_change' | 'design_status_change';
  orderId: string;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
  triggeredBy?: string;
}

export interface WorkflowRule {
  fromModule: 'orders' | 'production' | 'accounting' | 'design';
  toModule: 'orders' | 'production' | 'accounting' | 'design';
  condition: (event: WorkflowEvent) => boolean;
  action: (event: WorkflowEvent) => Promise<void>;
}

class WorkflowService {
  private rules: WorkflowRule[] = [];
  private eventHistory: WorkflowEvent[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // Rule 1: Order confirmed → Create production task
    this.addRule({
      fromModule: 'orders',
      toModule: 'production',
      condition: (event) => event.type === 'order_status_change' && event.newStatus === 'confirmed',
      action: async (event) => {
        // ...existing code...
        // Trigger production creation
        await this.createProductionFromOrder(event.orderId);
      }
    });

    // Rule 2: Production completed → Update order status
    this.addRule({
      fromModule: 'production',
      toModule: 'orders',
      condition: (event) => event.type === 'production_status_change' && event.newStatus === 'completed',
      action: async (event) => {
        // ...existing code...
        await this.updateOrderStatus(event.orderId, 'production_completed');
      }
    });

    // Rule 3: Order completed → Create payment record
    this.addRule({
      fromModule: 'orders',
      toModule: 'accounting',
      condition: (event) => event.type === 'order_status_change' && event.newStatus === 'completed',
      action: async (event) => {
        // ...existing code...
        await this.createPaymentFromOrder(event.orderId);
      }
    });

    // Rule 4: Design approved → Update order to confirmed
    this.addRule({
      fromModule: 'design',
      toModule: 'orders',
      condition: (event) => event.type === 'design_status_change' && event.newStatus === 'approved',
      action: async (event) => {
        // ...existing code...
        await this.updateOrderStatus(event.orderId, 'confirmed');
      }
    });
  }

  addRule(rule: WorkflowRule) {
    this.rules.push(rule);
  }

  async processEvent(event: WorkflowEvent) {
    this.eventHistory.push(event);
    
    // Find and execute matching rules
    const matchingRules = this.rules.filter(rule => rule.condition(event));
    
    for (const rule of matchingRules) {
      try {
        await rule.action(event);
        // ...existing code...
      } catch (error) {
        // ...existing code...
      }
    }
  }

  // Implementation methods for workflow actions
  private async createProductionFromOrder(orderId: string) {
    // This would integrate with the production module
    // For now, we'll simulate the action
    const event: WorkflowEvent = {
      type: 'production_status_change',
      orderId,
      oldStatus: '',
      newStatus: 'pending',
      timestamp: new Date().toISOString()
    };
    
    // In real implementation, this would call production module API
    // ...existing code...
    return event;
  }

  private async updateOrderStatus(orderId: string, newStatus: string) {
    // This would integrate with the orders module
    const event: WorkflowEvent = {
      type: 'order_status_change',
      orderId,
      oldStatus: 'unknown',
      newStatus,
      timestamp: new Date().toISOString()
    };
    
    // ...existing code...
    return event;
  }

  private async createPaymentFromOrder(orderId: string) {
    // This would integrate with the accounting module
    const event: WorkflowEvent = {
      type: 'payment_status_change',
      orderId,
      oldStatus: '',
      newStatus: 'pending',
      timestamp: new Date().toISOString()
    };
    
    // ...existing code...
    return event;
  }

  // Utility methods
  getEventHistory(): WorkflowEvent[] {
    return this.eventHistory;
  }

  getEventsByOrder(orderId: string): WorkflowEvent[] {
    return this.eventHistory.filter(event => event.orderId === orderId);
  }

  getWorkflowStatus(orderId: string): {
    order: string;
    design: string;
    production: string;
    payment: string;
  } {
    const events = this.getEventsByOrder(orderId);
    
    // Get latest status for each module
    const orderEvents = events.filter(e => e.type === 'order_status_change');
    const designEvents = events.filter(e => e.type === 'design_status_change');
    const productionEvents = events.filter(e => e.type === 'production_status_change');
    const paymentEvents = events.filter(e => e.type === 'payment_status_change');

    return {
      order: orderEvents.length > 0 ? orderEvents[orderEvents.length - 1].newStatus : 'pending',
      design: designEvents.length > 0 ? designEvents[designEvents.length - 1].newStatus : 'not_started',
      production: productionEvents.length > 0 ? productionEvents[productionEvents.length - 1].newStatus : 'not_started',
      payment: paymentEvents.length > 0 ? paymentEvents[paymentEvents.length - 1].newStatus : 'not_started'
    };
  }
}

// Singleton instance
export const workflowService = new WorkflowService();

export default WorkflowService;