import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Bot, 
  Workflow, 
  BookOpen, 
  Mail, 
  Palette, 
  Link, 
  BarChart3, 
  Settings 
} from 'lucide-react';

const navigationItems = [
  { 
    name: 'Dashboard', 
    href: '/admin', 
    icon: LayoutDashboard,
    gradient: 'from-accent-blue to-accent-teal'
  },
  { 
    name: 'Clients', 
    href: '/admin/clients', 
    icon: Users,
    gradient: 'from-accent-purple to-accent-blue'
  },
  { 
    name: 'Bots', 
    href: '/admin/bots', 
    icon: Bot,
    gradient: 'from-accent-teal to-accent-green'
  },
  { 
    name: 'Builder', 
    href: '/admin/builder', 
    icon: Workflow,
    gradient: 'from-accent-green to-accent-orange'
  },
  { 
    name: 'Knowledge', 
    href: '/admin/knowledge', 
    icon: BookOpen,
    gradient: 'from-accent-orange to-accent-pink'
  },
  { 
    name: 'Nurture', 
    href: '/admin/nurture', 
    icon: Mail,
    gradient: 'from-accent-pink to-accent-purple'
  },
  { 
    name: 'Branding', 
    href: '/admin/branding', 
    icon: Palette,
    gradient: 'from-primary to-secondary'
  },
  { 
    name: 'Integrations', 
    href: '/admin/integrations', 
    icon: Link,
    gradient: 'from-secondary to-accent-blue'
  },
  { 
    name: 'Analytics', 
    href: '/admin/analytics', 
    icon: BarChart3,
    gradient: 'from-accent-blue to-accent-teal'
  },
  { 
    name: 'Settings', 
    href: '/admin/settings', 
    icon: Settings,
    gradient: 'from-accent-teal to-accent-green'
  },
];

export const AdminSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border/50 min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
            (item.href !== '/admin' && location.pathname.startsWith(item.href));

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r text-white shadow-colored"
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
              style={isActive ? {
                backgroundImage: `linear-gradient(135deg, hsl(var(--${item.gradient.split(' ')[0].replace('from-', '').replace('-', '-')})), hsl(var(--${item.gradient.split(' ')[1].replace('to-', '').replace('-', '-')})))`
              } : undefined}
            >
              <div className={cn(
                "p-2 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-white/20" 
                  : "bg-gradient-to-br group-hover:shadow-glow",
                !isActive && `bg-gradient-to-br ${item.gradient}`
              )}>
                <Icon className={cn(
                  "h-4 w-4 transition-colors duration-200",
                  isActive ? "text-white" : "text-white"
                )} />
              </div>
              <span className={cn(
                "font-medium transition-colors duration-200",
                isActive ? "text-white" : ""
              )}>
                {item.name}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-3 w-2 h-2 rounded-full bg-white/80" />
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};