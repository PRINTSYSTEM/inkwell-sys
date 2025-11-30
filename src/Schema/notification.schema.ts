import { z } from "zod";
import { IdSchema, DateSchema } from "./common/base";

// Notification Type Enum
export const NotificationTypeEnum = z.enum([
  "system",
  "assignment",
  "performance",
  "attendance",
  "deadline",
  "approval",
  "announcement",
  "reminder",
  "alert",
  "update",
]);

// Notification Channel Enum
export const NotificationChannelEnum = z.enum([
  "in_app",
  "email",
  "sms",
  "push",
  "slack",
  "teams",
]);

// Notification Status Enum
export const NotificationStatusEnum = z.enum([
  "pending",
  "sent",
  "delivered",
  "read",
  "failed",
  "cancelled",
]);

// Notification Template Schema
export const NotificationTemplateSchema = z.object({
  id: IdSchema,
  name: z.string(),
  type: NotificationTypeEnum,
  subject: z.string(),
  body: z.string(),
  variables: z.array(z.string()).default([]),
  channels: z.array(NotificationChannelEnum).default(["in_app"]),
  isActive: z.boolean().default(true),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: IdSchema,
});

// Notification Action Schema
export const NotificationActionSchema = z.object({
  id: IdSchema,
  label: z.string(),
  action: z.enum(["view", "approve", "reject", "redirect", "dismiss"]),
  url: z.string().url().optional(),
  data: z.record(z.unknown()).optional(),
  style: z
    .enum(["primary", "secondary", "success", "warning", "danger"])
    .default("primary"),
});

// Main Notification Schema
export const NotificationSchema = z.object({
  id: IdSchema,
  type: NotificationTypeEnum,

  // Content
  title: z.string(),
  message: z.string(),
  summary: z.string().optional(),

  // Recipients
  recipientId: IdSchema,
  recipientType: z.enum(["user", "role", "department", "all"]).default("user"),

  // Metadata
  relatedEntityType: z.string().optional(),
  relatedEntityId: IdSchema.optional(),
  templateId: IdSchema.optional(),

  // Delivery
  channels: z.array(NotificationChannelEnum).default(["in_app"]),
  scheduledFor: DateSchema.optional(),
  expiresAt: DateSchema.optional(),

  // Actions
  actions: z.array(NotificationActionSchema).default([]),

  // Status tracking
  status: NotificationStatusEnum,
  isRead: z.boolean().default(false),
  readAt: DateSchema.optional(),
  deliveryStatus: z
    .object({
      in_app: NotificationStatusEnum.optional(),
      email: NotificationStatusEnum.optional(),
      sms: NotificationStatusEnum.optional(),
      push: NotificationStatusEnum.optional(),
      slack: NotificationStatusEnum.optional(),
      teams: NotificationStatusEnum.optional(),
    })
    .optional(),

  // Analytics
  clickCount: z.number().min(0).default(0),
  firstClickedAt: DateSchema.optional(),
  lastClickedAt: DateSchema.optional(),

  // Metadata
  data: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).default([]),

  // Timestamps
  createdAt: DateSchema,
  updatedAt: DateSchema,
  sentAt: DateSchema.optional(),
  createdBy: IdSchema.optional(),
});

// Notification Preferences Schema
export const NotificationPreferencesSchema = z.object({
  id: IdSchema,
  userId: IdSchema,

  // Global settings
  enabled: z.boolean().default(true),
  quietHours: z
    .object({
      enabled: z.boolean().default(false),
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      timezone: z.string().default("Asia/Ho_Chi_Minh"),
    })
    .optional(),

  // Channel preferences
  channels: z.object({
    in_app: z.object({
      enabled: z.boolean().default(true),
      showDesktop: z.boolean().default(true),
      playSound: z.boolean().default(true),
    }),
    email: z.object({
      enabled: z.boolean().default(true),
      frequency: z
        .enum(["immediate", "hourly", "daily", "weekly"])
        .default("immediate"),
      digest: z.boolean().default(false),
    }),
    sms: z.object({
      enabled: z.boolean().default(false),
      urgentOnly: z.boolean().default(true),
    }),
    push: z.object({
      enabled: z.boolean().default(true),
      showPreview: z.boolean().default(true),
    }),
  }),

  // Type preferences
  types: z.object({
    system: z.object({
      enabled: z.boolean().default(true),
      channels: z.array(NotificationChannelEnum).default(["in_app", "email"]),
    }),
    assignment: z.object({
      enabled: z.boolean().default(true),
      channels: z
        .array(NotificationChannelEnum)
        .default(["in_app", "email", "push"]),
    }),
    performance: z.object({
      enabled: z.boolean().default(true),
      channels: z.array(NotificationChannelEnum).default(["in_app", "email"]),
    }),
    attendance: z.object({
      enabled: z.boolean().default(true),
      channels: z.array(NotificationChannelEnum).default(["in_app"]),
    }),
    deadline: z.object({
      enabled: z.boolean().default(true),
      channels: z
        .array(NotificationChannelEnum)
        .default(["in_app", "email", "push"]),
    }),
    approval: z.object({
      enabled: z.boolean().default(true),
      channels: z.array(NotificationChannelEnum).default(["in_app", "email"]),
    }),
    announcement: z.object({
      enabled: z.boolean().default(true),
      channels: z.array(NotificationChannelEnum).default(["in_app"]),
    }),
    reminder: z.object({
      enabled: z.boolean().default(true),
      channels: z.array(NotificationChannelEnum).default(["in_app", "push"]),
    }),
  }),

  updatedAt: DateSchema,
});

// Notification Statistics Schema
export const NotificationStatsSchema = z.object({
  userId: IdSchema.optional(),
  period: z.object({
    start: DateSchema,
    end: DateSchema,
  }),

  overview: z.object({
    total_sent: z.number().min(0),
    total_delivered: z.number().min(0),
    total_read: z.number().min(0),
    total_clicked: z.number().min(0),
    delivery_rate: z.number().min(0).max(100),
    read_rate: z.number().min(0).max(100),
    click_rate: z.number().min(0).max(100),
  }),

  by_type: z.array(
    z.object({
      type: NotificationTypeEnum,
      count: z.number().min(0),
      read_count: z.number().min(0),
      click_count: z.number().min(0),
    })
  ),

  by_channel: z.array(
    z.object({
      channel: NotificationChannelEnum,
      sent: z.number().min(0),
      delivered: z.number().min(0),
      failed: z.number().min(0),
      delivery_rate: z.number().min(0).max(100),
    })
  ),

  trends: z.array(
    z.object({
      date: DateSchema,
      sent: z.number().min(0),
      read: z.number().min(0),
      clicked: z.number().min(0),
    })
  ),
});

// Create Notification Schema
export const CreateNotificationSchema = NotificationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  isRead: true,
  readAt: true,
  sentAt: true,
  clickCount: true,
  firstClickedAt: true,
  lastClickedAt: true,
});

// Update Notification Schema
export const UpdateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
  status: NotificationStatusEnum.optional(),
  data: z.record(z.unknown()).optional(),
});

// Notification Filter Schema
export const NotificationFilterSchema = z.object({
  search: z.string().optional(),
  type: NotificationTypeEnum.optional(),
  status: NotificationStatusEnum.optional(),
  isRead: z.boolean().optional(),
  recipientId: IdSchema.optional(),
  channels: z.array(NotificationChannelEnum).optional(),
  createdAfter: DateSchema.optional(),
  createdBefore: DateSchema.optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z
    .enum(["createdAt", "priority", "title", "status"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Bulk Operations Schema
export const BulkNotificationActionSchema = z.object({
  notificationIds: z.array(IdSchema),
  action: z.enum(["mark_read", "mark_unread", "delete", "archive"]),
  data: z.record(z.unknown()).optional(),
});

// Export types
export type NotificationType = z.infer<typeof NotificationTypeEnum>;
export type NotificationChannel = z.infer<typeof NotificationChannelEnum>;
export type NotificationStatus = z.infer<typeof NotificationStatusEnum>;
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>;
export type NotificationAction = z.infer<typeof NotificationActionSchema>;
export type NotificationPreferences = z.infer<
  typeof NotificationPreferencesSchema
>;
export type NotificationStats = z.infer<typeof NotificationStatsSchema>;
export type CreateNotification = z.infer<typeof CreateNotificationSchema>;
export type UpdateNotification = z.infer<typeof UpdateNotificationSchema>;
export type NotificationFilter = z.infer<typeof NotificationFilterSchema>;
export type BulkNotificationAction = z.infer<
  typeof BulkNotificationActionSchema
>;
