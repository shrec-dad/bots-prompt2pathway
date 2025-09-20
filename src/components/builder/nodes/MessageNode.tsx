import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export const MessageNode: React.FC<NodeProps> = ({ data, selected }) => {
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
          <div className="p-2 rounded-lg bg-gradient-to-br from-accent-blue to-accent-teal flex-shrink-0">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm mb-1 truncate">
              {String(data.label || 'Message Node')}
            </h3>
            {data.content && (
              <p className="text-xs text-muted-foreground line-clamp-3">
                {String(data.content)}
              </p>
            )}
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