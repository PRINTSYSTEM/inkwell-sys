// TODO: notificationService needs to be implemented
// Temporary stub for notificationService

export const notificationService = {
  sendAssignmentNotification: async (
    userId: string,
    title: string,
    assignmentId: string,
    type: string
  ) => {
    console.log('sendAssignmentNotification', { userId, title, assignmentId, type });
    return Promise.resolve();
  },
  sendPerformanceNotification: async (
    userId: string,
    data: any,
    type: string
  ) => {
    console.log('sendPerformanceNotification', { userId, data, type });
    return Promise.resolve();
  },
  sendSystemNotification: async (
    userIds: string[],
    title: string,
    message: string,
    priority: string
  ) => {
    console.log('sendSystemNotification', { userIds, title, message, priority });
    return Promise.resolve();
  },
  createNotification: async (notification: any) => {
    console.log('createNotification', notification);
    return Promise.resolve();
  },
};

