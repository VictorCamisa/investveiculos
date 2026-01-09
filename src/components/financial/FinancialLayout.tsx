import { Outlet } from 'react-router-dom';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import {
  DollarSign,
  LayoutDashboard,
  Receipt,
  FileText,
  TrendingUp,
  PieChart,
  Coins,
  Bell,
} from 'lucide-react';

const navItems = [
  { path: '/financeiro', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { path: '/financeiro/lancamentos', label: 'Lançamentos', icon: <Receipt className="h-4 w-4" /> },
  { path: '/financeiro/dre', label: 'DRE', icon: <FileText className="h-4 w-4" /> },
  { path: '/financeiro/fluxo-caixa', label: 'Fluxo de Caixa', icon: <TrendingUp className="h-4 w-4" /> },
  { path: '/financeiro/rentabilidade', label: 'Rentabilidade', icon: <PieChart className="h-4 w-4" /> },
  { path: '/financeiro/comissoes', label: 'Comissões', icon: <Coins className="h-4 w-4" /> },
  { path: '/financeiro/alertas', label: 'Alertas', icon: <Bell className="h-4 w-4" /> },
];

export function FinancialLayout() {
  return (
    <div>
      <ModuleHeader
        icon={DollarSign}
        title="Financeiro"
        description="Controle financeiro e relatórios"
        basePath="/financeiro"
        navItems={navItems}
      />
      <Outlet />
    </div>
  );
}
