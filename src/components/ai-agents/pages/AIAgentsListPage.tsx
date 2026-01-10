import { NavLink } from 'react-router-dom';
import { useAIAgents, useUpdateAIAgent, useDeleteAIAgent } from '@/hooks/useAIAgents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bot, 
  Settings, 
  Play, 
  Pause, 
  BarChart3, 
  Trash2,
  MessageSquare,
  Wrench,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { AGENT_OBJECTIVES, LLM_MODELS } from '@/types/ai-agents';

export function AIAgentsListPage() {
  const { data: agents, isLoading } = useAIAgents();
  const updateAgent = useUpdateAIAgent();
  const deleteAgent = useDeleteAIAgent();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'training': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'training': return 'Em Treinamento';
      default: return status;
    }
  };

  const getModelLabel = (model: string) => {
    for (const provider of Object.values(LLM_MODELS)) {
      const found = provider.find(m => m.value === model);
      if (found) return found.label;
    }
    return model;
  };

  const getObjectiveLabel = (objective: string) => {
    const found = AGENT_OBJECTIVES.find(o => o.value === objective);
    return found?.label || objective;
  };

  const handleToggleStatus = (agent: { id: string; status: string }) => {
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    updateAgent.mutate({ id: agent.id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!agents?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum agente configurado</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Crie seu primeiro agente de IA para automatizar qualificação de leads, 
            agendamentos e atendimento ao cliente.
          </p>
          <NavLink to="/ai-agents/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Agente
            </Button>
          </NavLink>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {agents.map(agent => (
        <Card key={agent.id} className="group hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {getObjectiveLabel(agent.objective)}
                  </CardDescription>
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs",
                  agent.status === 'active' && "bg-green-500/20 text-green-700 dark:text-green-400",
                  agent.status === 'inactive' && "bg-gray-500/20 text-gray-700 dark:text-gray-400",
                  agent.status === 'training' && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full mr-1", getStatusColor(agent.status))} />
                {getStatusLabel(agent.status)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {agent.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {agent.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Brain className="h-3.5 w-3.5" />
                <span>{getModelLabel(agent.llm_model)}</span>
              </div>
            </div>

            {/* Stats placeholder */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold">0</div>
                <div className="text-xs text-muted-foreground">Ferramentas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">0</div>
                <div className="text-xs text-muted-foreground">Conversas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">0</div>
                <div className="text-xs text-muted-foreground">Leads</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <NavLink to={`/ai-agents/${agent.id}/basico`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </NavLink>
              
              <Button 
                variant="outline" 
                size="icon"
                className="h-8 w-8"
                onClick={() => handleToggleStatus(agent)}
                disabled={updateAgent.isPending}
              >
                {agent.status === 'active' ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              <NavLink to={`/ai-agents/${agent.id}/monitoramento`}>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </NavLink>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir agente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. O agente "{agent.name}" e todas as suas 
                      configurações, ferramentas e histórico serão permanentemente excluídos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteAgent.mutate(agent.id)}
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
  );
}

// Add missing Brain icon import
import { Brain } from 'lucide-react';

export default AIAgentsListPage;
