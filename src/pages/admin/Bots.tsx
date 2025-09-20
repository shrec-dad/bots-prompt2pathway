import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bot, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Star,
  Calendar,
  PhoneCall,
  Mail,
  Users as UsersIcon,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BotType } from '@/types/bot';

const mockBots = [
  {
    id: '1',
    name: 'Lead Qualifier Pro',
    type: 'lead-qualifier' as BotType,
    plan: 'custom',
    status: 'active',
    leads: 245,
    conversionRate: 28.4,
    lastActivity: '2 hours ago',
    createdAt: '2024-01-15',
    nurture: true
  },
  {
    id: '2',
    name: 'Appointment Scheduler',
    type: 'appointment-booking' as BotType,
    plan: 'basic',
    status: 'active',
    leads: 158,
    conversionRate: 41.2,
    lastActivity: '5 minutes ago',
    createdAt: '2024-01-12',
    nurture: false
  },
  {
    id: '3',
    name: 'Support Assistant',
    type: 'customer-support' as BotType,
    plan: 'custom',
    status: 'active',
    leads: 89,
    conversionRate: 15.7,
    lastActivity: '1 hour ago',
    createdAt: '2024-01-10',
    nurture: false
  },
  {
    id: '4',
    name: 'Waitlist Manager',
    type: 'waitlist' as BotType,
    plan: 'basic',
    status: 'draft',
    leads: 0,
    conversionRate: 0,
    lastActivity: '3 days ago',
    createdAt: '2024-01-08',
    nurture: true
  },
  {
    id: '5',
    name: 'Social Media Engagement',
    type: 'social-media' as BotType,
    plan: 'custom',
    status: 'paused',
    leads: 67,
    conversionRate: 22.8,
    lastActivity: '1 day ago',
    createdAt: '2024-01-05',
    nurture: false
  }
];

const botTypeLabels = {
  'lead-qualifier': 'Lead Qualifier',
  'appointment-booking': 'Appointment Booking',
  'customer-support': 'Customer Support',
  'waitlist': 'Waitlist',
  'social-media': 'Social Media'
};

const getBotIcon = (type: BotType) => {
  switch (type) {
    case 'lead-qualifier':
      return <Star className="h-4 w-4" />;
    case 'appointment-booking':
      return <Calendar className="h-4 w-4" />;
    case 'customer-support':
      return <PhoneCall className="h-4 w-4" />;
    case 'waitlist':
      return <Mail className="h-4 w-4" />;
    case 'social-media':
      return <UsersIcon className="h-4 w-4" />;
  }
};

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

const getPlanBadge = (plan: string) => {
  return plan === 'custom' 
    ? <Badge className="bg-gradient-primary text-primary-foreground">Custom</Badge>
    : <Badge variant="outline">Basic</Badge>;
};

export const Bots: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredBots = mockBots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || bot.type === filterType;
    const matchesStatus = filterStatus === 'all' || bot.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Bots</h1>
          <p className="text-muted-foreground">
            Manage all your bots and their configurations
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Create New Bot
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bots..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Bot Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="lead-qualifier">Lead Qualifier</SelectItem>
                <SelectItem value="appointment-booking">Appointment Booking</SelectItem>
                <SelectItem value="customer-support">Customer Support</SelectItem>
                <SelectItem value="waitlist">Waitlist</SelectItem>
                <SelectItem value="social-media">Social Media</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBots.map((bot) => (
          <Card key={bot.id} className="group hover:shadow-large transition-all duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary">
                    {getBotIcon(bot.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{bot.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {botTypeLabels[bot.type]}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      {bot.status === 'active' ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Status and Plan */}
              <div className="flex items-center justify-between">
                {getStatusBadge(bot.status)}
                {getPlanBadge(bot.plan)}
              </div>

              {/* Nurture Add-on */}
              {bot.nurture && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Mail className="h-3 w-3 mr-1" />
                    Nurture
                  </Badge>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{bot.leads}</p>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{bot.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">Conversion</p>
                </div>
              </div>

              {/* Last Activity */}
              <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
                Last activity: {bot.lastActivity}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBots.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No bots found</h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first bot'
              }
            </p>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Create New Bot
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};