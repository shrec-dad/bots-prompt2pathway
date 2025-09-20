import React from 'react';
import { Node } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Trash2 } from 'lucide-react';

interface NodeInspectorProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, data: any) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({ 
  selectedNode, 
  onUpdateNode 
}) => {
  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="p-4 rounded-full bg-muted/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Settings className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-2">No Node Selected</h3>
          <p className="text-sm text-muted-foreground">
            Click on a node to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const handleLabelChange = (value: string) => {
    onUpdateNode(selectedNode.id, { label: value });
  };

  const handleContentChange = (value: string) => {
    onUpdateNode(selectedNode.id, { content: value });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Inspector</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {selectedNode.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                ID: {selectedNode.id}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Basic Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="node-label" className="text-sm font-medium">
                Label
              </Label>
            <Input
              id="node-label"
              value={String(selectedNode.data.label || '')}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="Enter node label"
              className="mt-1"
            />
            </div>

            {selectedNode.type === 'message' && (
              <div>
                <Label htmlFor="node-content" className="text-sm font-medium">
                  Message Content
                </Label>
                <Textarea
                  id="node-content"
                  value={String(selectedNode.data.content || '')}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter message content"
                  className="mt-1 min-h-[100px]"
                />
              </div>
            )}

            {selectedNode.type === 'input' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="input-type" className="text-sm font-medium">
                    Input Type
                  </Label>
                  <select 
                    id="input-type"
                    className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                    defaultValue="text"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="number">Number</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="input-placeholder" className="text-sm font-medium">
                    Placeholder
                  </Label>
                  <Input
                    id="input-placeholder"
                    placeholder="Enter placeholder text"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {selectedNode.type === 'choice' && (
              <div>
                <Label className="text-sm font-medium">
                  Choice Options
                </Label>
                <div className="mt-2 space-y-2">
                  <Input placeholder="Option 1" />
                  <Input placeholder="Option 2" />
                  <Button variant="outline" size="sm" className="w-full">
                    Add Option
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Required Field</Label>
              <input type="checkbox" className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Skip on Mobile</Label>
              <input type="checkbox" className="rounded" />
            </div>
          </CardContent>
        </Card>

        {/* Position Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">X</Label>
                <Input 
                  value={Math.round(selectedNode.position.x)} 
                  readOnly 
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Y</Label>
                <Input 
                  value={Math.round(selectedNode.position.y)} 
                  readOnly 
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};