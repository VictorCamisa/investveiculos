import { Outlet, NavLink } from 'react-router-dom';
import { MessageSquare, Settings, Users, FileText, QrCode, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserDetails } from '@/hooks/useUsers';

export function WhatsAppLayout() {
  const { user } = useAuth();
  const { data: currentUserDetails } = useUserDetails(user?.id || null);
  
  // Check if user is manager (gerente or master)
  const isManager = currentUserDetails?.is_master || 
    currentUserDetails?.roles?.includes('gerente') || false;

  const navItems = [
    ...(isManager ? [{ label: 'Painel', href: '/whatsapp/painel', icon: LayoutDashboard }] : []),
    { label: 'Conversas', href: '/whatsapp', icon: MessageSquare },
    { label: 'Contatos', href: '/whatsapp/contatos', icon: Users },
    { label: 'Templates', href: '/whatsapp/templates', icon: FileText },
    { label: 'Instâncias', href: '/whatsapp/instancias', icon: QrCode },
    { label: 'Configurações', href: '/whatsapp/config', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Sub Navigation */}
      <div className="border-b bg-card">
        <div className="flex items-center gap-1 p-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/whatsapp'}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
