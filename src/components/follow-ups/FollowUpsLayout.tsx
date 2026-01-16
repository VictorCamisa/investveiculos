import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCcw, 
  MessageCircle, 
  Mail,
  Zap
} from 'lucide-react';

const tabs = [
  { value: 'reactivation', label: 'Reativação', icon: RefreshCcw, path: '/crm/follow-ups' },
  { value: 'whatsapp', label: 'Ativação WhatsApp', icon: MessageCircle, path: '/crm/follow-ups/whatsapp' },
  { value: 'email', label: 'Ativação Email', icon: Mail, path: '/crm/follow-ups/email' },
];

export function FollowUpsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab from path
  const getActiveTab = () => {
    if (location.pathname.includes('/whatsapp')) return 'whatsapp';
    if (location.pathname.includes('/email')) return 'email';
    return 'reactivation';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (value: string) => {
    const tab = tabs.find(t => t.value === value);
    if (tab) {
      navigate(tab.path);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Follow-ups & Ativações</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie regras de reativação e campanhas de ativação para leads
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              className="gap-2"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  );
}
