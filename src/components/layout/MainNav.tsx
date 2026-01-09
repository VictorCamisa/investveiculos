import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Car,
  ShoppingCart,
  DollarSign,
  Megaphone,
  Coins,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { path: '/crm', label: 'CRM', icon: <Users className="h-4 w-4" /> },
  { path: '/estoque', label: 'Estoque', icon: <Car className="h-4 w-4" /> },
  { path: '/vendas', label: 'Vendas', icon: <ShoppingCart className="h-4 w-4" /> },
  { path: '/comissoes', label: 'Comissões', icon: <Coins className="h-4 w-4" /> },
  { path: '/financeiro', label: 'Financeiro', icon: <DollarSign className="h-4 w-4" /> },
  { path: '/marketing', label: 'Marketing', icon: <Megaphone className="h-4 w-4" /> },
];

interface MainNavProps {
  vertical?: boolean;
  onItemClick?: () => void;
}

export function MainNav({ vertical = false, onItemClick }: MainNavProps) {
  const location = useLocation();

  return (
    <nav className={cn(
      'flex gap-1',
      vertical ? 'flex-col' : 'items-center'
    )}>
      {navItems.map((item) => {
        const isActive = item.path === '/dashboard' 
          ? location.pathname === '/dashboard'
          : location.pathname.startsWith(item.path);
        
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onItemClick}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
              'hover:bg-accent hover:text-accent-foreground',
              isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground'
            )}
          >
            {item.icon}
            <span className={vertical ? '' : 'hidden sm:inline'}>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
