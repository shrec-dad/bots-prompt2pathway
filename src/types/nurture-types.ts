// src/types/nurture-types.ts

/** ───────────────────────────────────────────────────────────────────────────
 * Recipient Management Types
 * ───────────────────────────────────────────────────────────────────────────*/

export type Recipient = {
  _id: string; // unique ID
  email: string;
  phone?: string; // optional for SMS
  name?: string;
  company?: string;
  status: "active" | "inactive";
  tags?: string[]; // for segmentation
};

/** ───────────────────────────────────────────────────────────────────────────
 * Channel Configuration (Email/SMS/Both per day)
 * ───────────────────────────────────────────────────────────────────────────*/

export type ChannelType = "email" | "sms" | "both";

export type DayChannelConfig = {
  channel: ChannelType;
  // Email-specific
  emailSubject?: string;
  emailBody?: string;
  // SMS-specific (shorter, optimized)
  smsBody?: string;
};

/** ───────────────────────────────────────────────────────────────────────────
 * Campaign Types (Bulk Send)
 * ───────────────────────────────────────────────────────────────────────────*/

export type CampaignStatus = 
  | "draft" 
  | "scheduled" 
  | "sending" 
  | "completed" 
  | "paused" 
  | "failed";

export type Campaign = {
  id: string;
  instanceId: string;
  name: string;
  status: CampaignStatus;
  
  // Recipients
  recipientIds: string[]; // references to Recipient.id
  totalRecipients: number;
  
  // Schedule
  startDate?: string; // ISO date or "immediate"
  scheduleMode: "relative" | "calendar";
  
  // Progress tracking
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  scheduledAt?: number;
  startedAt?: number;
  completedAt?: number;
};

/** ───────────────────────────────────────────────────────────────────────────
 * Analytics Types (Nurture-specific tracking)
 * ───────────────────────────────────────────────────────────────────────────*/

export type RecipientEngagement = {
  recipientId: string;
  email: string;
  name?: string;
  
  // Per-day tracking
  daysReceived: number[]; // [1, 2, 3, ...] which days they got
  daysOpened: number[]; // which days they opened
  daysClicked: number[]; // which days they clicked
  
  // Overall status
  totalOpens: number;
  totalClicks: number;
  lastOpenedAt?: number; // timestamp
  lastClickedAt?: number;
  
  // Engagement score (0-100)
  engagementScore: number;
  
  // Classification
  segment: "hot" | "warm" | "cold" | "unengaged";
};

export type DayPerformance = {
  dayNumber: number; // 1-14
  
  // Delivery
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
  
  // Engagement
  opens: number;
  uniqueOpens: number;
  clicks: number;
  uniqueClicks: number;
  
  // Rates
  openRate: number; // percentage
  clickRate: number; // percentage
  bounceRate: number; // percentage
  
  // Best time
  bestOpenTime?: string; // "14:00-15:00"
};

export type NurtureAnalytics = {
  instanceId: string;
  campaignId?: string; // optional campaign association
  
  // Overall campaign metrics
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  
  // Engagement overview
  totalOpens: number;
  totalClicks: number;
  uniqueOpens: number;
  uniqueClicks: number;
  
  // Rates
  overallOpenRate: number;
  overallClickRate: number;
  overallConversionRate: number;
  
  // Segmentation
  hotLeads: number; // high engagement
  warmLeads: number; // medium engagement
  coldLeads: number; // low engagement
  unengaged: number; // zero engagement
  
  // Per-recipient tracking
  recipients: RecipientEngagement[];
  
  // Per-day performance
  dayPerformance: DayPerformance[];
  
  // Updated timestamp
  lastUpdated: number;
};

/** ───────────────────────────────────────────────────────────────────────────
 * Event Types (for tracking)
 * ───────────────────────────────────────────────────────────────────────────*/

export type NurtureEventType =
  | "email.sent"
  | "email.delivered"
  | "email.bounced"
  | "email.opened"
  | "email.clicked"
  | "email.unsubscribed"
  | "sms.sent"
  | "sms.delivered"
  | "sms.failed"
  | "sms.clicked";

export type NurtureEvent = {
  id: string;
  type: NurtureEventType;
  timestamp: number;
  
  // Context
  instanceId: string;
  campaignId?: string;
  recipientId: string;
  dayNumber: number; // which day (1-14)
  
  // Event-specific data
  metadata?: {
    link?: string; // for clicks
    reason?: string; // for bounces/failures
    provider?: string; // ESP name
    messageId?: string; // provider message ID
  };
};

/** ───────────────────────────────────────────────────────────────────────────
 * SMS Provider Types (future support)
 * ───────────────────────────────────────────────────────────────────────────*/

export type SMSProvider = "twilio" | "plivo" | "messagebird" | "bandwidth" | null;

export type SMSConfig = {
  provider: SMSProvider;
  accountId?: string;
  fromNumber?: string; // sender phone number
  enabled: boolean;
};

/** ───────────────────────────────────────────────────────────────────────────
 * Import/Export Types
 * ───────────────────────────────────────────────────────────────────────────*/

export type CSVImportResult = {
  success: number;
  failed: number;
  duplicates: number;
  errors: Array<{ row: number; reason: string }>;
  imported: Omit<Recipient, "_id">[];
};

export type RecipientExportFormat = "csv" | "xlsx" | "json";

/** ───────────────────────────────────────────────────────────────────────────
 * Validation Types
 * ───────────────────────────────────────────────────────────────────────────*/

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

/** ───────────────────────────────────────────────────────────────────────────
 * Helper Types
 * ───────────────────────────────────────────────────────────────────────────*/

export type RecipientFilter = {
  status?: Recipient["status"][];
  tags?: string[];
  search?: string; // search in email, name, company
  segment?: RecipientEngagement["segment"][];
};

export type BulkAction = 
  | "tag" 
  | "untag" 
  | "delete" 
  | "unsubscribe" 
  | "reactivate" 
  | "export";
