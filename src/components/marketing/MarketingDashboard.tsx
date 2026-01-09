import { useState } from 'react';
import { 
  useMetaAdsSync, 
  useMetaCampaigns, 
  useMetaKPIs, 
  useMetaDailyInsights,
  useMetaCampaignInsights,
  useMetaSyncLogs 
} from '@/hooks/useMetaAds';
import MetaKPICards from './MetaKPICards';
import MetaInsightsCharts from './MetaInsightsCharts';
import MetaCampaignsList from './MetaCampaignsList';
import MetaSyncStatus from './MetaSyncStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, List, Settings2 } from 'lucide-react';

export default function MarketingDashboard() {
  const [dateRange, setDateRange] = useState<'7' | '14' | '30'>('30');
  
  // Data hooks
  const { mutate: syncAds, isPending: isSyncing } = useMetaAdsSync();
  const { data: campaigns = [], isLoading: campaignsLoading } = useMetaCampaigns();
  const { data: syncLogs = [], isLoading: syncLogsLoading } = useMetaSyncLogs();
  const { data: dailyInsights = [], isLoading: dailyInsightsLoading } = useMetaDailyInsights(parseInt(dateRange));
  const { data: campaignInsights = [], isLoading: campaignInsightsLoading } = useMetaCampaignInsights();
  const { kpis, isLoading: kpisLoading } = useMetaKPIs();

  const isLoading = campaignsLoading || kpisLoading || dailyInsightsLoading || campaignInsightsLoading;

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
  const pausedCampaigns = campaigns.filter(c => c.status === 'PAUSED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meta Ads</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              {activeCampaigns} Ativas
            </Badge>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              {pausedCampaigns} Pausadas
            </Badge>
          </div>
        </div>

        <Select value={dateRange} onValueChange={(v) => setDateRange(v as '7' | '14' | '30')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="14">Últimos 14 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sync Status Card */}
      <MetaSyncStatus
        syncLogs={syncLogs}
        isLoading={syncLogsLoading}
        isSyncing={isSyncing}
        onSync={() => syncAds()}
      />

      {/* KPI Cards */}
      <MetaKPICards kpis={kpis} isLoading={kpisLoading} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Campanhas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <MetaInsightsCharts
            dailyInsights={dailyInsights}
            campaignInsights={campaignInsights}
            isLoading={dailyInsightsLoading || campaignInsightsLoading}
          />
        </TabsContent>

        <TabsContent value="campaigns">
          <MetaCampaignsList
            campaigns={campaigns}
            isLoading={campaignsLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
