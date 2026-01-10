import { Outlet, NavLink, useParams, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Bot, 
  Settings, 
  Brain, 
  Database, 
  Wrench, 
  GitBranch, 
  Shield, 
  BarChart3, 
  Bell, 
  FlaskConical, 
  Rocket,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAIAgent } from '@/hooks/useAIAgents';
import { Badge } from '@/components/ui/badge';

const agentTabs = [
  { id: 'basico', label: 'Básico', icon: Settings },
  { id: 'llm', label: 'Modelo LLM', icon: Brain },
  { id: 'memoria', label: 'Memória', icon: Database },
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench },
  { id: 'workflows', label: 'Workflows', icon: GitBranch },
  { id: 'guardrails', label: 'Guardrails', icon: Shield },
  { id: 'monitoramento', label: 'Monitoramento', icon: BarChart3 },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'testes', label: 'Testes', icon: FlaskConical },
  { id: 'implantacao', label: 'Implantação', icon: Rocket },
];

export function AIAgentsLayout() {
  const { agentId } = useParams();
  const location = useLocation();
  const { data: agent } = useAIAgent(agentId);
  
  const isListView = location.pathname === '/ai-agents' || location.pathname === '/ai-agents/';
  const isNewAgent = location.pathname === '/ai-agents/novo';

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {(agentId || isNewAgent) && (
                <NavLink to="/ai-agents">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </NavLink>
              )}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">
                    {isNewAgent 
                      ? 'Novo Agente de IA' 
                      : agent?.name || 'Centro de Comando de IA'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isNewAgent 
                      ? 'Configure seu novo agente autônomo'
                      : agent 
                        ? 'Configure e monitore seu agente'
                        : 'Configure, monitore e otimize seus agentes autônomos'}
                  </p>
                </div>
              </div>
              {agent && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-2",
                    agent.status === 'active' && "bg-green-500/20 text-green-700 dark:text-green-400",
                    agent.status === 'inactive' && "bg-gray-500/20 text-gray-700 dark:text-gray-400",
                    agent.status === 'training' && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full mr-1.5", getStatusColor(agent.status))} />
                  {getStatusLabel(agent.status)}
                </Badge>
              )}
            </div>
            
            {isListView && (
              <NavLink to="/ai-agents/novo">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Agente
                </Button>
              </NavLink>
            )}
          </div>
        </div>

        {/* Navigation Tabs - Only show when editing an agent */}
        {agentId && !isNewAgent && (
          <div className="container">
            <nav className="flex gap-1 overflow-x-auto pb-px">
              {agentTabs.map((tab) => {
                const isActive = location.pathname.includes(`/${tab.id}`);
                return (
                  <NavLink
                    key={tab.id}
                    to={`/ai-agents/${agentId}/${tab.id}`}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap",
                      "border-b-2 -mb-px",
                      isActive
                        ? "border-primary text-primary bg-background"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="container py-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AIAgentsLayout;
