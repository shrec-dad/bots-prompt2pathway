import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, 
  Type, 
  GitBranch, 
  Zap, 
  Play, 
  Link, 
  Brain,
  Plus
} from 'lucide-react';

interface NodePaletteProps {
  onAddNode: (type: string) => void;
}

const nodeCategories = [
  {
    title: 'Communication',
    nodes: [
      {
        type: 'message',
        label: 'Message',
        description: 'Display text to users',
        icon: MessageSquare,
        color: 'from-accent-blue to-accent-teal'
      },
      {
        type: 'input',
        label: 'Input',
        description: 'Collect user information',
        icon: Type,
        color: 'from-accent-teal to-accent-green'
      },
      {
        type: 'choice',
        label: 'Choice',
        description: 'Present multiple options',
        icon: GitBranch,
        color: 'from-accent-green to-accent-orange'
      }
    ]
  },
  {
    title: 'Logic & Actions',
    nodes: [
      {
        type: 'logic',
        label: 'Logic',
        description: 'Conditional branching',
        icon: Zap,
        color: 'from-accent-orange to-accent-pink'
      },
      {
        type: 'action',
        label: 'Action',
        description: 'Perform actions',
        icon: Play,
        color: 'from-accent-pink to-accent-purple'
      }
    ]
  },
  {
    title: 'Advanced',
    nodes: [
      {
        type: 'integration',
        label: 'Integration',
        description: 'Connect external services',
        icon: Link,
        color: 'from-accent-purple to-primary'
      },
      {
        type: 'ai',
        label: 'AI Response',
        description: 'Generate AI responses',
        icon: Brain,
        color: 'from-primary to-secondary'
      }
    ]
  }
];

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold text-foreground">Node Palette</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Drag and drop to add nodes to your bot
        </p>
      </div>

      <div className="p-4 space-y-6">
        {nodeCategories.map((category) => (
          <div key={category.title}>
            <h3 className="text-sm font-medium text-foreground mb-3">
              {category.title}
            </h3>
            <div className="grid gap-3">
              {category.nodes.map((node) => {
                const Icon = node.icon;
                return (
                  <Card 
                    key={node.type}
                    className="group cursor-pointer hover:shadow-medium transition-all duration-200 border-border/50 hover:border-primary/30 overflow-hidden"
                    onClick={() => onAddNode(node.type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className={`p-2 rounded-lg bg-gradient-to-br ${node.color} flex-shrink-0 group-hover:shadow-glow transition-all duration-200`}
                        >
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {node.label}
                            </h4>
                            <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {node.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};