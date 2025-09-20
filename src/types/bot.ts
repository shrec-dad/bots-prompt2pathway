export type BotType = 'lead-qualifier' | 'appointment-booking' | 'customer-support' | 'waitlist' | 'social-media';

export type BotPlan = 'basic' | 'custom';

export type BotAddons = {
  nurture: boolean;
};

export interface Bot {
  id: string;
  clientId: string;
  name: string;
  type: BotType;
  plan: BotPlan;
  addons: BotAddons;
  branding: BotBranding;
  settings: BotSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotBranding {
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  bubbleImage?: string;
  bubbleSize: 'small' | 'medium' | 'large';
  bubblePosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  greetingText: string;
}

export interface BotSettings {
  isActive: boolean;
  timezone: string;
  language: string;
  customFields: Record<string, any>;
  integrations: BotIntegrations;
}

export interface BotIntegrations {
  webhook?: {
    url: string;
    secret: string;
    enabled: boolean;
  };
  email?: {
    recipients: string[];
    enabled: boolean;
  };
  crm?: {
    type: string;
    mapping: Record<string, string>;
    enabled: boolean;
  };
}

export interface BotNode {
  id: string;
  type: 'message' | 'input' | 'choice' | 'logic' | 'action' | 'integration' | 'ai';
  position: { x: number; y: number };
  data: {
    label: string;
    content?: string;
    options?: string[];
    conditions?: Array<{
      field: string;
      operator: string;
      value: string;
      targetNodeId: string;
    }>;
    settings?: Record<string, any>;
  };
}

export interface BotFlow {
  nodes: BotNode[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
}