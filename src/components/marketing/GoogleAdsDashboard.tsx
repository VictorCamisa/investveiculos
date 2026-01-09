import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  TrendingUp, 
  MousePointer, 
  Eye, 
  DollarSign,
  Target,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Megaphone
} from 'lucide-react';
import {
  useGoogleCampaigns,
  useGoogleAdGroups,
  useGoogleAds,
  useGoogleSyncLogs,
  useGoogleAdsSync,
  useGoogleAdsKPIs,
} from '@/hooks/useGoogleAds';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    ENABLED: { variant: 'default', label: 'Ativo' },
    PAUSED: { variant: 'secondary', label: 'Pausado' },
    REMOVED: { variant: 'destructive', label: 'Removido' },
  };
  
  const config = statusMap[status] || { variant: 'outline' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function GoogleAdsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: campaigns, isLoading: loadingCampaigns } = useGoogleCampaigns();
  const { data: adGroups, isLoading: loadingAdGroups } = useGoogleAdGroups();
  const { data: ads, isLoading: loadingAds } = useGoogleAds();
  const { data: syncLogs, isLoading: loadingSyncLogs } = useGoogleSyncLogs();
  const { data: kpis, isLoading: loadingKPIs } = useGoogleAdsKPIs();
  
  const syncMutation = useGoogleAdsSync();

  const lastSync = syncLogs?.[0];
  const isRunning = lastSync?.status === 'running';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Google Ads</h1>
          <p className="text-muted-foreground">
            Gerencie suas campanhas e analise métricas do Google Ads
          </p>
        </div>
        <Button 
          onClick={() => syncMutation.mutate({})}
          disabled={syncMutation.isPending || isRunning}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending || isRunning ? 'animate-spin' : ''}`} />
          {syncMutation.isPending || isRunning ? 'Sincronizando...' : 'Sincronizar'}
        </Button>
      </div>

      {/* Sync Status */}
      {lastSync && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {lastSync.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {lastSync.status === 'failed' && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                {lastSync.status === 'running' && (
                  <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
                )}
                <div>
                  <p className="font-medium">
                    Última sincronização: {' '}
                    {lastSync.completed_at 
                      ? new Date(lastSync.completed_at).toLocaleString('pt-BR')
                      : 'Em andamento...'}
                  </p>
                  {lastSync.status === 'completed' && (
                    <p className="text-sm text-muted-foreground">
                      {lastSync.campaigns_synced} campanhas, {lastSync.ad_groups_synced} grupos, {lastSync.ads_synced} anúncios
                    </p>
                  )}
                  {lastSync.error_message && (
                    <p className="text-sm text-destructive">{lastSync.error_message}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressões</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingKPIs ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatNumber(kpis?.impressions || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingKPIs ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(kpis?.clicks || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  CTR: {formatPercent(kpis?.ctr || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investimento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingKPIs ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(kpis?.spend || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  CPC: {formatCurrency(kpis?.cpc || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingKPIs ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(kpis?.conversions || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  CPL: {formatCurrency(kpis?.costPerConversion || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROAS</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingKPIs ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{(kpis?.roas || 0).toFixed(2)}x</div>
                <p className="text-xs text-muted-foreground">
                  Receita: {formatCurrency(kpis?.conversionsValue || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Campanhas ({campaigns?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="ad-groups" className="flex items-center gap-2">
            Grupos ({adGroups?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="ads" className="flex items-center gap-2">
            Anúncios ({ads?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Campanhas por Status</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCampaigns ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <div className="space-y-4">
                    {['ENABLED', 'PAUSED'].map((status) => {
                      const count = campaigns?.filter((c) => c.status === status).length || 0;
                      const total = campaigns?.length || 1;
                      const percent = (count / total) * 100;
                      
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(status)}
                            <span className="text-sm text-muted-foreground">{count} campanhas</span>
                          </div>
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${status === 'ENABLED' ? 'bg-green-500' : 'bg-yellow-500'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Sincronização</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSyncLogs ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <div className="space-y-2">
                    {syncLogs?.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('pt-BR', { 
                            dateStyle: 'short', 
                            timeStyle: 'short' 
                          })}
                        </span>
                        <Badge 
                          variant={
                            log.status === 'completed' ? 'default' : 
                            log.status === 'failed' ? 'destructive' : 'secondary'
                          }
                        >
                          {log.status === 'completed' ? 'Sucesso' : 
                           log.status === 'failed' ? 'Falha' : 'Em andamento'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campanhas</CardTitle>
              <CardDescription>Lista de campanhas sincronizadas do Google Ads</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCampaigns ? (
                <Skeleton className="h-64 w-full" />
              ) : campaigns?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma campanha encontrada. Clique em Sincronizar para buscar dados.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Orçamento Diário</TableHead>
                      <TableHead>Última Sync</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns?.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {campaign.advertising_channel_type || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {campaign.daily_budget 
                            ? formatCurrency(campaign.daily_budget)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {campaign.last_sync_at 
                            ? new Date(campaign.last_sync_at).toLocaleString('pt-BR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ad-groups">
          <Card>
            <CardHeader>
              <CardTitle>Grupos de Anúncios</CardTitle>
              <CardDescription>Lista de grupos de anúncios sincronizados</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAdGroups ? (
                <Skeleton className="h-64 w-full" />
              ) : adGroups?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum grupo de anúncios encontrado.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>CPC Máximo</TableHead>
                      <TableHead>Última Sync</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adGroups?.map((adGroup) => (
                      <TableRow key={adGroup.id}>
                        <TableCell className="font-medium">{adGroup.name}</TableCell>
                        <TableCell>{getStatusBadge(adGroup.status)}</TableCell>
                        <TableCell>
                          {adGroup.cpc_bid_micros 
                            ? formatCurrency(adGroup.cpc_bid_micros / 1000000)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {adGroup.last_sync_at 
                            ? new Date(adGroup.last_sync_at).toLocaleString('pt-BR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads">
          <Card>
            <CardHeader>
              <CardTitle>Anúncios</CardTitle>
              <CardDescription>Lista de anúncios sincronizados</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAds ? (
                <Skeleton className="h-64 w-full" />
              ) : ads?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum anúncio encontrado.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Headlines</TableHead>
                      <TableHead>Última Sync</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ads?.map((ad) => (
                      <TableRow key={ad.id}>
                        <TableCell className="font-medium">{ad.name}</TableCell>
                        <TableCell>{getStatusBadge(ad.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ad.ad_type || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {ad.headlines?.join(', ') || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {ad.last_sync_at 
                            ? new Date(ad.last_sync_at).toLocaleString('pt-BR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
