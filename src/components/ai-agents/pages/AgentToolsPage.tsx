import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAIAgentTools, useCreateAIAgentTool, useUpdateAIAgentTool, useDeleteAIAgentTool } from '@/hooks/useAIAgents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wrench, 
  Plus, 
  Pencil, 
  Trash2, 
  ExternalLink,
  Code,
  Play,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolFormDialog } from '../forms/ToolFormDialog';
import type { AIAgentTool } from '@/types/ai-agents';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AUTH_METHODS } from '@/types/ai-agents';

export function AgentToolsPage() {
  const { agentId } = useParams();
  const { data: tools, isLoading } = useAIAgentTools(agentId);
  const updateTool = useUpdateAIAgentTool();
  const deleteTool = useDeleteAIAgentTool();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<AIAgentTool | null>(null);

  const handleToggleActive = (tool: AIAgentTool) => {
    updateTool.mutate({ id: tool.id, is_active: !tool.is_active });
  };

  const handleEdit = (tool: AIAgentTool) => {
    setEditingTool(tool);
    setDialogOpen(true);
  };

  const handleDelete = (tool: AIAgentTool) => {
    if (agentId) {
      deleteTool.mutate({ id: tool.id, agentId });
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingTool(null);
  };

  const getAuthMethodLabel = (method: string) => {
    return AUTH_METHODS.find(m => m.value === method)?.label || method;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ferramentas (Function Calling)</h2>
          <p className="text-sm text-muted-foreground">
            Configure as ferramentas que o agente pode utilizar para realizar ações ou obter informações.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ferramenta
        </Button>
      </div>

      {!tools?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Wrench className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Nenhuma ferramenta configurada</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Adicione ferramentas para que o agente possa consultar estoque, 
              criar leads, agendar visitas e mais.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Ferramenta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tools.map(tool => (
            <Card key={tool.id} className={cn(!tool.is_active && "opacity-60")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-mono">{tool.name}</CardTitle>
                        <Badge variant={tool.is_active ? "default" : "secondary"}>
                          {tool.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <CardDescription>{tool.description}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={tool.is_active}
                    onCheckedChange={() => handleToggleActive(tool)}
                    disabled={updateTool.isPending}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Endpoint</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                        {tool.endpoint_url || 'Não configurado'}
                      </code>
                      {tool.endpoint_url && (
                        <a 
                          href={tool.endpoint_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Autenticação</p>
                    <p className="text-sm">{getAuthMethodLabel(tool.auth_method)}</p>
                  </div>
                </div>

                {tool.orchestration_rules && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Regra de Orquestração</p>
                    <p className="text-sm italic text-muted-foreground">"{tool.orchestration_rules}"</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(tool)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Code className="h-4 w-4 mr-2" />
                    Ver Schema
                  </Button>
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Testar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir ferramenta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. A ferramenta "{tool.name}" será permanentemente excluída.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(tool)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ToolFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        agentId={agentId!}
        tool={editingTool}
      />
    </div>
  );
}

export default AgentToolsPage;
