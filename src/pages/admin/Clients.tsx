import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Building, Bot, TrendingUp, Activity } from 'lucide-react';

const mockClients = [
  {
    id: '1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    plan: 'Enterprise',
    activeBots: 8,
    totalLeads: 1247,
    status: 'active',
    joinedDate: '2024-01-15',
    lastActivity: '2 hours ago'
  },
  {
    id: '2', 
    name: 'Tech Startup Inc',
    email: 'hello@techstartup.com',
    plan: 'Professional',
    activeBots: 4,
    totalLeads: 567,
    status: 'active',
    joinedDate: '2024-02-01',
    lastActivity: '1 day ago'
  },
  {
    id: '3',
    name: 'Local Business',
    email: 'info@localbiz.com',
    plan: 'Basic',
    activeBots: 2,
    totalLeads: 89,
    status: 'active',
    joinedDate: '2024-02-15',
    lastActivity: '3 hours ago'
  },
  {
    id: '4',
    name: 'E-commerce Store',
    email: 'support@ecomstore.com',
    plan: 'Professional',
    activeBots: 6,
    totalLeads: 892,
    status: 'inactive',
    joinedDate: '2024-01-08',
    lastActivity: '2 weeks ago'
  }
];

const getPlanBadge = (plan: string) => {
  const variants = {
    'Enterprise': 'bg-gradient-primary text-primary-foreground',
    'Professional': 'bg-accent-blue text-white',
    'Basic': 'bg-muted text-muted-foreground'
  };
  return (
    <Badge className={variants[plan as keyof typeof variants] || 'bg-muted text-muted-foreground'}>
      {plan}
    </Badge>
  );
};

const getStatusBadge = (status: string) => {
  return status === 'active' 
    ? <Badge className="bg-success text-success-foreground">Active</Badge>
    : <Badge variant="outline">Inactive</Badge>;
};

export const Clients: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Clients</h1>
          <p className="text-muted-foreground">
            Manage your clients and their bot configurations
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold text-foreground mt-2">4</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                <p className="text-2xl font-bold text-foreground mt-2">3</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent-green to-success">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bots</p>
                <p className="text-2xl font-bold text-foreground mt-2">20</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent-blue to-accent-teal">
                <Bot className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold text-foreground mt-2">2,795</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent-orange to-accent-pink">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <p className="text-sm text-muted-foreground">
            Overview of all your clients and their activity
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockClients.map((client) => (
              <div 
                key={client.id}
                className="flex items-center justify-between p-6 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{client.name}</h4>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Joined {client.joinedDate}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">
                      {client.activeBots}
                    </p>
                    <p className="text-xs text-muted-foreground">Bots</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">
                      {client.totalLeads.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Leads</p>
                  </div>
                  
                  <div className="text-center min-w-[100px]">
                    {getPlanBadge(client.plan)}
                  </div>
                  
                  <div className="text-center min-w-[80px]">
                    {getStatusBadge(client.status)}
                  </div>
                  
                  <div className="text-right min-w-[120px]">
                    <p className="text-xs text-muted-foreground">
                      Last activity
                    </p>
                    <p className="text-xs font-medium text-foreground">
                      {client.lastActivity}
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
export default Clients;
