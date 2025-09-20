import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Calendar, 
  Mail, 
  PhoneCall,
  Zap,
  Star,
  Activity
} from 'lucide-react';

const stats = [
  {
    title: 'Active Bots',
    value: '12',
    change: '+2 this month',
    changeType: 'positive' as const,
    icon: Bot,
    gradient: 'from-primary to-secondary'
  },
  {
    title: 'Total Leads',
    value: '1,247',
    change: '+12% from last month',
    changeType: 'positive' as const,
    icon: Users,
    gradient: 'from-accent-blue to-accent-teal'
  },
  {
    title: 'Conversations',
    value: '3,891',
    change: '+8% from last month',
    changeType: 'positive' as const,
    icon: MessageSquare,
    gradient: 'from-accent-teal to-accent-green'
  },
  {
    title: 'Conversion Rate',
    value: '23.4%',
    change: '+2.1% from last month',
    changeType: 'positive' as const,
    icon: TrendingUp,
    gradient: 'from-accent-green to-accent-orange'
  }
];

const recentBots = [
  {
    id: '1',
    name: 'Lead Qualifier Pro',
    type: 'Lead Qualifier',
    status: 'active',
    leads: 245,
    conversionRate: '28.4%',
    lastActivity: '2 hours ago'
  },
  {
    id: '2', 
    name: 'Appointment Scheduler',
    type: 'Appointment Booking',
    status: 'active',
    leads: 158,
    conversionRate: '41.2%',
    lastActivity: '5 minutes ago'
  },
  {
    id: '3',
    name: 'Support Assistant',
    type: 'Customer Support',
    status: 'active',
    leads: 89,
    conversionRate: '15.7%',
    lastActivity: '1 hour ago'
  },
  {
    id: '4',
    name: 'Waitlist Manager',
    type: 'Waitlist',
    status: 'draft',
    leads: 0,
    conversionRate: '0%',
    lastActivity: '3 days ago'
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-success text-success-foreground">Active</Badge>;
    case 'draft':
      return <Badge variant="secondary">Draft</Badge>;
    case 'paused':
      return <Badge variant="outline">Paused</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getBotIcon = (type: string) => {
  switch (type) {
    case 'Lead Qualifier':
      return <Star className="h-4 w-4" />;
    case 'Appointment Booking':
      return <Calendar className="h-4 w-4" />;
    case 'Customer Support':
      return <PhoneCall className="h-4 w-4" />;
    case 'Waitlist':
      return <Mail className="h-4 w-4" />;
    default:
      return <Bot className="h-4 w-4" />;
  }
};

export const Dashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your multi-bot platform performance
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Zap className="h-4 w-4 mr-2" />
          Create New Bot
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-2">
                      {stat.value}
                    </p>
                    <p className={`text-xs mt-2 ${
                      stat.changeType === 'positive' 
                        ? 'text-success' 
                        : 'text-destructive'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                  <div 
                    className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-glow`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Bots */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Bots</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your most recently updated bots and their performance
            </p>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBots.map((bot) => (
              <div 
                key={bot.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary">
                    {getBotIcon(bot.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{bot.name}</h4>
                    <p className="text-sm text-muted-foreground">{bot.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {bot.leads}
                    </p>
                    <p className="text-xs text-muted-foreground">Leads</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {bot.conversionRate}
                    </p>
                    <p className="text-xs text-muted-foreground">Conversion</p>
                  </div>
                  
                  <div className="text-center min-w-[80px]">
                    {getStatusBadge(bot.status)}
                  </div>
                  
                  <div className="text-right min-w-[100px]">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {bot.lastActivity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};