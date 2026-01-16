import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  RefreshCcw, 
  MessageCircle, 
  Mail,
} from 'lucide-react';

const tabs = [
  { value: 'reactivation', label: 'Reativação', icon: RefreshCcw, path: '/crm/follow-ups' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, path: '/crm/follow-ups/whatsapp' },
  { value: 'email', label: 'Email', icon: Mail, path: '/crm/follow-ups/email' },
];

export function FollowUpsLayout() {
  const location = useLocation();

  return (
    <div className="space-y-6">
      {/* Simple pill navigation */}
      <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
        {tabs.map((tab) => {
          const isActive = tab.path === '/crm/follow-ups' 
            ? location.pathname === '/crm/follow-ups'
            : location.pathname === tab.path;
          
          return (
            <NavLink
              key={tab.value}
              to={tab.path}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                isActive 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
}
