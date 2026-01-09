import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, PieChart, Megaphone, Wrench } from 'lucide-react';
import { MarketingCockpit } from './MarketingCockpit';
import { LeadOriginComplete } from './LeadOriginComplete';
import { CampaignsTab } from './CampaignsTab';
import { ToolsTab } from './ToolsTab';

export function MarketingPageSimplified() {
  const [activeTab, setActiveTab] = useState('cockpit');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="cockpit" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Cockpit</span>
          </TabsTrigger>
          <TabsTrigger value="origem" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Origem de Leads</span>
          </TabsTrigger>
          <TabsTrigger value="campanhas" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Campanhas</span>
          </TabsTrigger>
          <TabsTrigger value="ferramentas" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Ferramentas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cockpit" className="mt-6">
          <MarketingCockpit />
        </TabsContent>

        <TabsContent value="origem" className="mt-6">
          <LeadOriginComplete />
        </TabsContent>

        <TabsContent value="campanhas" className="mt-6">
          <CampaignsTab />
        </TabsContent>

        <TabsContent value="ferramentas" className="mt-6">
          <ToolsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
