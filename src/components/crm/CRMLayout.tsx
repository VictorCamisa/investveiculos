import { Outlet } from 'react-router-dom';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { QualificationTargetSelector } from './QualificationTargetSelector';
import {
  Users,
  LayoutDashboard,
  UserPlus,
  MessageSquare,
  BarChart3,
  XCircle,
} from 'lucide-react';

const navItems = [
  { path: '/crm', label: 'Pipeline', icon: <LayoutDashboard className="h-4 w-4" /> },
  { path: '/crm/leads', label: 'Leads', icon: <UserPlus className="h-4 w-4" /> },
  { path: '/crm/follow-ups', label: 'Follow-ups', icon: <MessageSquare className="h-4 w-4" /> },
  { path: '/crm/perdas', label: 'Perdas', icon: <XCircle className="h-4 w-4" /> },
  { path: '/crm/analytics', label: 'Análises', icon: <BarChart3 className="h-4 w-4" /> },
];

export function CRMLayout() {
  return (
    <div>
      <ModuleHeader
        icon={Users}
        title="CRM"
        description="Gerencie leads e negociações"
        basePath="/crm"
        navItems={navItems}
        actions={<QualificationTargetSelector />}
      />
      <Outlet />
    </div>
  );
}
