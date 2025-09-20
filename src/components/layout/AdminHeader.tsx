import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bot, Save, TestTube, Download, Sparkles } from 'lucide-react';
import { BotType } from '@/types/bot';

interface AdminHeaderProps {
  botName?: string;
  botType?: BotType;
  onBotTypeChange?: (type: BotType) => void;
  onTest?: () => void;
  onExport?: () => void;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
}

const BOT_TYPE_LABELS: Record<BotType, string> = {
  'lead-qualifier': 'Lead Qualifier',
  'appointment-booking': 'Appointment Booking',
  'customer-support': 'Customer Support',
  'waitlist': 'Waitlist',
  'social-media': 'Social Media'
};

const AdminHeader: React.FC<AdminHeaderProps> = ({
  botName = "Lead Qualifier Pro",
  botType = "lead-qualifier",
  onBotTypeChange,
  onTest,
  onExport,
  onSave,
  hasUnsavedChanges = false
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-card/95 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section - Bot Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">{botName}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {BOT_TYPE_LABELS[botType]}
                </Badge>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-xs text-warning">
                    Unsaved
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Bot Type Selector */}
        <div className="flex items-center gap-3">
          <Select value={botType} onValueChange={onBotTypeChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BOT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onTest}>
            <TestTube className="h-4 w-4 mr-2" />
            Test
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            size="sm" 
            onClick={onSave} 
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </header>
  );
};

export { AdminHeader };