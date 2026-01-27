import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { QualificationTargetSelector } from './QualificationTargetSelector';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  UserPlus,
  MessageSquare,
  BarChart3,
  XCircle,
  Bot,
  BotOff,
  Loader2,
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useCRMAgent } from '@/hooks/useCRMAgent';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { path: '/crm', label: 'Pipeline', icon: LayoutDashboard },
  { path: '/crm/leads', label: 'Leads', icon: UserPlus },
  { path: '/crm/follow-ups', label: 'Follow-ups', icon: MessageSquare },
  { path: '/crm/perdas', label: 'Perdas', icon: XCircle },
  { path: '/crm/analytics', label: 'Análises', icon: BarChart3 },
];

export function CRMLayout() {
  const location = useLocation();
  const { agentState, isLoading, toggleAgent, isToggling } = useCRMAgent();

  const handleToggleAgent = () => {
    if (!agentState.agentId) {
      return;
    }
    toggleAgent(!agentState.isEnabled);
  };

  const getButtonContent = () => {
    if (isLoading || isToggling) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {isToggling ? 'Alterando...' : 'Carregando...'}
        </>
      );
    }

    if (!agentState.agentId) {
      return (
        <>
          <BotOff className="h-4 w-4" />
          Sem Agente
        </>
      );
    }

    return agentState.isEnabled ? (
      <>
        <Bot className="h-4 w-4" />
        Agente Ativo
      </>
    ) : (
      <>
        <BotOff className="h-4 w-4" />
        Agente Inativo
      </>
    );
  };

  const getTooltipContent = () => {
    if (!agentState.agentId) {
      return 'Configure um agente IA vinculado à instância principal do WhatsApp';
    }
    if (agentState.isEnabled) {
      return `${agentState.agentName || 'Agente'} está respondendo automaticamente na instância ${agentState.instanceName || 'principal'}`;
    }
    return `Clique para ativar ${agentState.agentName || 'o agente'}`;
  };

  return (
    <div className="space-y-4">
      {/* Compact sub-navigation */}
      <div className="flex items-center justify-between gap-4">
        <ScrollArea className="flex-1">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.path === '/crm' 
                ? location.pathname === '/crm'
                : location.pathname.startsWith(item.path);
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap',
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={agentState.isEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleAgent}
                  disabled={isLoading || isToggling || !agentState.agentId}
                  className={cn(
                    "gap-2 transition-all",
                    agentState.isEnabled 
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                      : "text-muted-foreground"
                  )}
                >
                  {getButtonContent()}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getTooltipContent()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <QualificationTargetSelector />
        </div>
      </div>

      <Outlet />
    </div>
  );
}
