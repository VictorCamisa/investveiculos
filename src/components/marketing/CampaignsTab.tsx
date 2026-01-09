import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Megaphone, Calendar, Facebook } from 'lucide-react';
import MarketingCampaignsPage from './MarketingCampaignsPage';
import { CampaignCalendar } from './CampaignCalendar';
import MarketingDashboard from './MarketingDashboard';
import { GoogleAdsDashboard } from './GoogleAdsDashboard';

// Google Ads icon
const GoogleAdsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.47 14.54l-2.67-4.62a.75.75 0 0 0-1.3 0l-6 10.4a.75.75 0 0 0 .65 1.12h5.34a.75.75 0 0 0 .65-.38l3.33-5.77a.75.75 0 0 0 0-.75z"/>
    <path d="M21.5 21.44l-6-10.4a.75.75 0 0 0-1.3 0l-2.67 4.62a.75.75 0 0 0 0 .75l3.33 5.77a.75.75 0 0 0 .65.38h5.34a.75.75 0 0 0 .65-1.12z"/>
    <circle cx="18" cy="6" r="3.75"/>
  </svg>
);

export function CampaignsTab() {
  const [activeSubTab, setActiveSubTab] = useState('campanhas');

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="campanhas" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="meta" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            Meta Ads
          </TabsTrigger>
          <TabsTrigger value="google" className="flex items-center gap-2">
            <GoogleAdsIcon className="h-4 w-4" />
            Google Ads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campanhas" className="mt-4">
          <MarketingCampaignsPage />
        </TabsContent>

        <TabsContent value="calendario" className="mt-4">
          <CampaignCalendar />
        </TabsContent>

        <TabsContent value="meta" className="mt-4">
          <MarketingDashboard />
        </TabsContent>

        <TabsContent value="google" className="mt-4">
          <GoogleAdsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
