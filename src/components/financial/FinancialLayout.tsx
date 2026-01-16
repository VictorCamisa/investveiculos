import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  TrendingUp,
  PieChart,
  Coins,
  Bell,
} from 'lucide-react';

const navItems = [
  { path: '/financeiro', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/financeiro/lancamentos', label: 'Lançamentos', icon: Receipt },
  { path: '/financeiro/dre', label: 'DRE', icon: FileText },
  { path: '/financeiro/fluxo-caixa', label: 'Fluxo de Caixa', icon: TrendingUp },
  { path: '/financeiro/rentabilidade', label: 'Rentabilidade', icon: PieChart },
  { path: '/financeiro/comissoes', label: 'Comissões', icon: Coins },
  { path: '/financeiro/alertas', label: 'Alertas', icon: Bell },
];

export function FinancialLayout() {
  const location = useLocation();

  return (
    <div className="space-y-4">
      <ScrollArea className="w-full">
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = item.path === '/financeiro' 
              ? location.pathname === '/financeiro'
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

      <Outlet />
    </div>
  );
}
