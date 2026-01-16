import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  CheckSquare,
  List,
  Users,
  TrendingUp,
} from 'lucide-react';

const navItems = [
  { path: '/vendas', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/vendas/aprovacoes', label: 'Aprovações', icon: CheckSquare },
  { path: '/vendas/vendas', label: 'Vendas', icon: List },
  { path: '/vendas/equipe', label: 'Equipe', icon: Users },
  { path: '/vendas/lucro', label: 'Lucro', icon: TrendingUp },
];

export function SalesLayout() {
  const location = useLocation();

  return (
    <div className="space-y-4">
      <ScrollArea className="w-full">
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = item.path === '/vendas' 
              ? location.pathname === '/vendas'
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
