import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Package,
  DollarSign,
  Megaphone,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Percent,
  UserCircle,
  ShoppingCart,
  Target,
  BarChart3,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { ModuleName } from '@/types/users';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  module?: ModuleName; // Required module access
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { 
    label: 'CRM', 
    icon: Target,
    module: 'crm',
    children: [
      { label: 'Pipeline', href: '/crm', icon: Target, module: 'crm' },
      { label: 'Leads', href: '/crm/leads', icon: Users, module: 'crm' },
      { label: 'Analytics', href: '/crm/analytics', icon: BarChart3, module: 'crm' },
    ]
  },
  { 
    label: 'Estoque', 
    icon: Package,
    module: 'estoque',
    children: [
      { label: 'Inventário', href: '/estoque', icon: Package, module: 'estoque' },
      { label: 'Vendas', href: '/vendas', icon: ShoppingCart, module: 'vendas' },
    ]
  },
  { label: 'Financeiro', href: '/financeiro', icon: DollarSign, module: 'financeiro' },
  { label: 'Marketing', href: '/marketing', icon: Megaphone, module: 'marketing' },
  { label: 'Comissões', href: '/comissoes', icon: Percent, module: 'comissoes' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(['CRM', 'Estoque']);
  const { user, signOut } = useAuth();
  const { hasModuleAccess, isLoading } = usePermissions();
  const location = useLocation();

  // Filter nav items based on permissions
  const filteredNavItems = navItems.filter((item) => {
    if (!item.module) return true; // Items without module requirement are always visible
    return hasModuleAccess(item.module);
  }).map((item) => {
    // Also filter children
    if (item.children) {
      return {
        ...item,
        children: item.children.filter((child) => {
          if (!child.module) return true;
          return hasModuleAccess(child.module);
        }),
      };
    }
    return item;
  }).filter((item) => {
    // Remove parent if all children were filtered out
    if (item.children && item.children.length === 0) return false;
    return true;
  });

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => 
      prev.includes(label) 
        ? prev.filter(m => m !== label) 
        : [...prev, label]
    );
  };

  const checkIsActive = (href?: string, children?: NavItem[]): boolean => {
    if (href) {
      return location.pathname === href || location.pathname.startsWith(href + '/');
    }
    if (children) {
      return children.some(child => 
        location.pathname === child.href || location.pathname.startsWith(child.href + '/')
      );
    }
    return false;
  };

  const getUserLabel = () => {
    return 'Usuário';
  };

  const renderNavItem = (item: NavItem) => {
    if (item.children && !collapsed) {
      const isMenuOpen = openMenus.includes(item.label);
      const hasActiveChild = checkIsActive(undefined, item.children);

      return (
        <Collapsible
          key={item.label}
          open={isMenuOpen}
          onOpenChange={() => toggleMenu(item.label)}
        >
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                hasActiveChild 
                  ? 'bg-sidebar-accent/50 text-sidebar-accent-foreground font-medium' 
                  : 'text-sidebar-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </div>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform",
                  isMenuOpen && "rotate-180"
                )} 
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 mt-1 space-y-1">
            {item.children.map(child => (
              <NavLink
                key={child.href}
                to={child.href!}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/80'
                  )
                }
              >
                <child.icon className="h-4 w-4 shrink-0" />
                <span>{child.label}</span>
              </NavLink>
            ))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    if (item.children && collapsed) {
      const firstChildHref = item.children[0]?.href || '/';
      const hasActiveChild = checkIsActive(undefined, item.children);
      return (
        <NavLink
          key={item.label}
          to={firstChildHref}
          className={cn(
            'flex items-center justify-center gap-3 px-2 py-2.5 rounded-lg transition-colors',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            hasActiveChild
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground'
          )}
          title={item.label}
        >
          <item.icon className="h-5 w-5 shrink-0" />
        </NavLink>
      );
    }

    return (
      <NavLink
        key={item.href}
        to={item.href!}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            isActive
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground',
            collapsed && 'justify-center px-2'
          )
        }
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  // Check if user has access to settings
  const hasSettingsAccess = hasModuleAccess('configuracoes');

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center w-full')}>
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">MV</span>
          </div>
          {!collapsed && <span className="font-semibold text-base">Matheus Veículos</span>}
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center p-2 border-b border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          filteredNavItems.map(renderNavItem)
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50',
            collapsed && 'justify-center px-2'
          )}
        >
          <UserCircle className="h-8 w-8 text-muted-foreground shrink-0" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-muted-foreground">
                {getUserLabel()}
              </p>
            </div>
          )}
        </div>

        <div className={cn('mt-2 space-y-1', collapsed && 'flex flex-col items-center')}>
          {hasSettingsAccess && (
            <NavLink
              to="/configuracoes"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <Settings className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Configurações</span>}
            </NavLink>
          )}

          <button
            onClick={signOut}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
              'hover:bg-destructive/10 hover:text-destructive text-sidebar-foreground',
              collapsed && 'justify-center px-2'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
