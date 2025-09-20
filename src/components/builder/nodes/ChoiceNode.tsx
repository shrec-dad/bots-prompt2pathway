import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';

export const ChoiceNode: React.FC<NodeProps> = ({ data, selected }) => {
  const options = Array.isArray(data.options) ? data.options : ['Option 1', 'Option 2'];

  return (
    <Card 
      className={`min-w-[220px] max-w-[360px] shadow-medium transition-all duration-200 ${
        selected 
          ? 'ring-2 ring-primary shadow-colored' 
          : 'hover:shadow-large'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-accent-green to-accent-orange flex-shrink-0">
            <GitBranch className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm mb-2 truncate">
              {String(data.label || 'Choice Node')}
            </h3>
            <div className="space-y-1">
              {options.slice(0, 3).map((option: string, index: number) => (
                <div key={index} className="bg-muted/50 rounded px-2 py-1 text-xs text-muted-foreground truncate">
                  {String(option)}
                </div>
              ))}
              {options.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{options.length - 3} more
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-primary border-2 border-background"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-primary border-2 border-background"
      />
    </Card>
  );
};