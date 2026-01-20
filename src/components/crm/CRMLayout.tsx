import { useState } from 'react';
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
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const navItems = [
  { path: '/crm', label: 'Pipeline', icon: LayoutDashboard },
  { path: '/crm/leads', label: 'Leads', icon: UserPlus },
  { path: '/crm/follow-ups', label: 'Follow-ups', icon: MessageSquare },
  { path: '/crm/perdas', label: 'Perdas', icon: XCircle },
  { path: '/crm/analytics', label: 'Análises', icon: BarChart3 },
];

export function CRMLayout() {
  const location = useLocation();
  const [agentEnabled, setAgentEnabled] = useState(false);

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
          <Button
            variant={agentEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setAgentEnabled(!agentEnabled)}
            className={cn(
              "gap-2 transition-all",
              agentEnabled 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                : "text-muted-foreground"
            )}
          >
            {agentEnabled ? (
              <>
                <Bot className="h-4 w-4" />
                Agente Ativo
              </>
            ) : (
              <>
                <BotOff className="h-4 w-4" />
                Agente Inativo
              </>
            )}
          </Button>
          <QualificationTargetSelector />
        </div>
      </div>

      <Outlet />
    </div>
  );
}
