import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  PieChart,
  GitCompare,
  Calendar,
  Link2,
  Bell,
  FileText,
  Facebook,
  Megaphone,
  Settings,
} from 'lucide-react';

// Google Ads icon as SVG component
const GoogleAdsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.47 14.54l-2.67-4.62a.75.75 0 0 0-1.3 0l-6 10.4a.75.75 0 0 0 .65 1.12h5.34a.75.75 0 0 0 .65-.38l3.33-5.77a.75.75 0 0 0 0-.75z"/>
    <path d="M21.5 21.44l-6-10.4a.75.75 0 0 0-1.3 0l-2.67 4.62a.75.75 0 0 0 0 .75l3.33 5.77a.75.75 0 0 0 .65.38h5.34a.75.75 0 0 0 .65-1.12z"/>
    <circle cx="18" cy="6" r="3.75"/>
  </svg>
);

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/marketing', label: 'Cockpit', icon: <LayoutDashboard className="h-4 w-4" /> },
  { path: '/marketing/origem-leads', label: 'Origem de Leads', icon: <PieChart className="h-4 w-4" /> },
  { path: '/marketing/comparativo', label: 'Comparativo', icon: <GitCompare className="h-4 w-4" /> },
  { path: '/marketing/calendario', label: 'Calendário', icon: <Calendar className="h-4 w-4" /> },
  { path: '/marketing/utm-builder', label: 'UTM Builder', icon: <Link2 className="h-4 w-4" /> },
  { path: '/marketing/alertas', label: 'Alertas', icon: <Bell className="h-4 w-4" /> },
  { path: '/marketing/relatorios', label: 'Relatórios', icon: <FileText className="h-4 w-4" /> },
  { path: '/marketing/meta-ads', label: 'Meta Ads', icon: <Facebook className="h-4 w-4" /> },
  { path: '/marketing/google-ads', label: 'Google Ads', icon: <GoogleAdsIcon className="h-4 w-4" /> },
  { path: '/marketing/campanhas', label: 'Campanhas', icon: <Megaphone className="h-4 w-4" /> },
  { path: '/marketing/configuracoes', label: 'Configurações', icon: <Settings className="h-4 w-4" /> },
];

export function MarketingNav() {
  const location = useLocation();

  return (
    <div className="border-b bg-card">
      <ScrollArea className="w-full">
        <nav className="flex items-center gap-1 px-4 py-2">
          {navItems.map((item) => {
            const isActive = item.path === '/marketing' 
              ? location.pathname === '/marketing'
              : location.pathname.startsWith(item.path);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground'
                )}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
