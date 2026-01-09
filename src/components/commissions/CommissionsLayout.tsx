import { Outlet } from 'react-router-dom';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import {
  Coins,
  LayoutDashboard,
  FileText,
  Target,
  Trophy,
  History,
  Calculator,
} from 'lucide-react';

const navItems = [
  { path: '/comissoes', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { path: '/comissoes/regras', label: 'Regras', icon: <FileText className="h-4 w-4" /> },
  { path: '/comissoes/metas', label: 'Metas', icon: <Target className="h-4 w-4" /> },
  { path: '/comissoes/ranking', label: 'Ranking', icon: <Trophy className="h-4 w-4" /> },
  { path: '/comissoes/historico', label: 'Histórico', icon: <History className="h-4 w-4" /> },
  { path: '/comissoes/simulador', label: 'Simulador', icon: <Calculator className="h-4 w-4" /> },
];

export function CommissionsLayout() {
  return (
    <div>
      <ModuleHeader
        icon={Coins}
        title="Comissões"
        description="Gerencie comissões e metas"
        basePath="/comissoes"
        navItems={navItems}
      />
      <Outlet />
    </div>
  );
}
