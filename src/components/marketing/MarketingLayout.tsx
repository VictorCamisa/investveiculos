import { Outlet } from 'react-router-dom';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import {
  Megaphone,
  LayoutDashboard,
  PieChart,
  GitCompare,
  Calendar,
  Link2,
  Bell,
  FileText,
  Facebook,
  Settings,
} from 'lucide-react';

// Google Ads icon
const GoogleAdsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.47 14.54l-2.67-4.62a.75.75 0 0 0-1.3 0l-6 10.4a.75.75 0 0 0 .65 1.12h5.34a.75.75 0 0 0 .65-.38l3.33-5.77a.75.75 0 0 0 0-.75z"/>
    <path d="M21.5 21.44l-6-10.4a.75.75 0 0 0-1.3 0l-2.67 4.62a.75.75 0 0 0 0 .75l3.33 5.77a.75.75 0 0 0 .65.38h5.34a.75.75 0 0 0 .65-1.12z"/>
    <circle cx="18" cy="6" r="3.75"/>
  </svg>
);

const navItems = [
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

export default function MarketingLayout() {
  return (
    <div>
      <ModuleHeader
        icon={Megaphone}
        title="Marketing"
        description="Campanhas, análises e automações"
        basePath="/marketing"
        navItems={navItems}
      />
      <Outlet />
    </div>
  );
}
