import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link2, Settings } from 'lucide-react';
import { UTMBuilder } from './UTMBuilder';
import MarketingSettingsPage from './MarketingSettingsPage';

export function ToolsTab() {
  const [activeSubTab, setActiveSubTab] = useState('utm');

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="utm" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            UTM Builder
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="utm" className="mt-4">
          <UTMBuilder />
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <MarketingSettingsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
