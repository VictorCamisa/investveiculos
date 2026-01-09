import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Info,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface ApiConfig {
  metaAppId: string;
  metaAppSecret: string;
  metaAccessToken: string;
  metaAdAccountId: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  googleCustomerId: string;
  googleDeveloperToken: string;
  isMetaConnected: boolean;
  isGoogleConnected: boolean;
}

export default function MarketingSettingsPage() {
  const [showMetaToken, setShowMetaToken] = useState(false);
  const [showMetaSecret, setShowMetaSecret] = useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [isTestingMeta, setIsTestingMeta] = useState(false);
  const [isTestingGoogle, setIsTestingGoogle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [config, setConfig] = useState<ApiConfig>({
    metaAppId: '',
    metaAppSecret: '',
    metaAccessToken: '',
    metaAdAccountId: '',
    googleClientId: '',
    googleClientSecret: '',
    googleRefreshToken: '',
    googleCustomerId: '',
    googleDeveloperToken: '',
    isMetaConnected: false,
    isGoogleConnected: false,
  });

  // Check connection status on mount by trying to sync
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    // Check Meta connection
    try {
      const { data: metaLogs } = await supabase
        .from('meta_sync_logs')
        .select('status, completed_at')
        .order('created_at', { ascending: false })
        .limit(1);
      
      const metaLogArray = metaLogs as { status: string; completed_at: string }[] | null;
      if (metaLogArray && metaLogArray.length > 0 && metaLogArray[0].status === 'completed') {
        setConfig(prev => ({ ...prev, isMetaConnected: true }));
      }
    } catch (e) {
      console.log('Error checking meta status:', e);
    }

    // Check Google connection
    try {
      const { data: googleLogs } = await supabase
        .from('google_sync_logs')
        .select('status, completed_at')
        .order('created_at', { ascending: false })
        .limit(1);
      
      const googleLogArray = googleLogs as { status: string; completed_at: string }[] | null;
      if (googleLogArray && googleLogArray.length > 0 && googleLogArray[0].status === 'completed') {
        setConfig(prev => ({ ...prev, isGoogleConnected: true }));
      }
    } catch (e) {
      console.log('Error checking google status:', e);
    }
  };

  const testMetaConnection = async () => {
    if (!config.metaAccessToken || !config.metaAdAccountId) {
      toast.error('Preencha o Token de Acesso e o ID da Conta de Anúncios');
      return;
    }
    
    setIsTestingMeta(true);
    toast.info('Testando conexão com Meta Ads...');
    
    try {
      // First, we need to save the secrets temporarily to test
      // Call the edge function with the credentials in the body for testing
      const { data, error } = await supabase.functions.invoke('meta-ads-sync', {
        body: { 
          syncType: 'test',
          testCredentials: {
            accessToken: config.metaAccessToken,
            adAccountId: config.metaAdAccountId.startsWith('act_') 
              ? config.metaAdAccountId 
              : `act_${config.metaAdAccountId}`
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Conexão com Meta Ads estabelecida! Sincronizando dados...');
        setConfig(prev => ({ ...prev, isMetaConnected: true }));
        
        // Now trigger full sync
        await supabase.functions.invoke('meta-ads-sync', {
          body: { 
            syncType: 'full',
            testCredentials: {
              accessToken: config.metaAccessToken,
              adAccountId: config.metaAdAccountId.startsWith('act_') 
                ? config.metaAdAccountId 
                : `act_${config.metaAdAccountId}`
            }
          }
        });
        
        toast.success('Dados do Meta Ads sincronizados com sucesso!');
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Meta connection error:', error);
      const errorMessage = error.message || 'Erro ao conectar com Meta Ads';
      
      if (errorMessage.includes('Invalid OAuth access token')) {
        toast.error('Token de acesso inválido. Verifique se o token está correto e não expirou.');
      } else if (errorMessage.includes('Invalid account')) {
        toast.error('ID da conta de anúncios inválido. Verifique se o ID está correto.');
      } else {
        toast.error(`Erro: ${errorMessage}`);
      }
      setConfig(prev => ({ ...prev, isMetaConnected: false }));
    } finally {
      setIsTestingMeta(false);
    }
  };

  const testGoogleConnection = async () => {
    if (!config.googleClientId || !config.googleClientSecret || !config.googleRefreshToken) {
      toast.error('Preencha o Client ID, Client Secret e Refresh Token do Google');
      return;
    }
    
    setIsTestingGoogle(true);
    toast.info('Testando conexão com Google Ads...');
    
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-sync', {
        body: { 
          syncType: 'test',
          testCredentials: {
            clientId: config.googleClientId,
            clientSecret: config.googleClientSecret,
            refreshToken: config.googleRefreshToken,
            customerId: config.googleCustomerId,
            developerToken: config.googleDeveloperToken
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Conexão com Google Ads estabelecida! Sincronizando dados...');
        setConfig(prev => ({ ...prev, isGoogleConnected: true }));
        
        // Now trigger full sync
        await supabase.functions.invoke('google-ads-sync', {
          body: { 
            syncType: 'full',
            testCredentials: {
              clientId: config.googleClientId,
              clientSecret: config.googleClientSecret,
              refreshToken: config.googleRefreshToken,
              customerId: config.googleCustomerId,
              developerToken: config.googleDeveloperToken
            }
          }
        });
        
        toast.success('Dados do Google Ads sincronizados com sucesso!');
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Google connection error:', error);
      toast.error(`Erro: ${error.message || 'Erro ao conectar com Google Ads'}`);
      setConfig(prev => ({ ...prev, isGoogleConnected: false }));
    } finally {
      setIsTestingGoogle(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      toast.info('Para salvar as credenciais de forma segura, use o botão "Testar Conexão" que valida e salva automaticamente.');
      
      // Save connection status locally for quick reference
      const statusConfig = {
        isMetaConnected: config.isMetaConnected,
        isGoogleConnected: config.isGoogleConnected,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('marketing_connection_status', JSON.stringify(statusConfig));
      
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Configuração de APIs</AlertTitle>
        <AlertDescription>
          Configure suas chaves de API para conectar o sistema com Meta Ads e Google Ads. 
          Ao clicar em "Testar Conexão", o sistema valida as credenciais e, se corretas, 
          sincroniza automaticamente todos os dados de campanhas.
        </AlertDescription>
      </Alert>

      {/* Meta Ads Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg">Meta Ads (Facebook/Instagram)</CardTitle>
                <CardDescription>Configure a integração com Meta Business</CardDescription>
              </div>
            </div>
            <Badge variant={config.isMetaConnected ? "default" : "secondary"} className="gap-1">
              {config.isMetaConnected ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Conectado
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Não conectado
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="metaAppId">App ID</Label>
              <Input
                id="metaAppId"
                placeholder="123456789012345"
                value={config.metaAppId}
                onChange={(e) => setConfig(prev => ({ ...prev, metaAppId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                ID do aplicativo Meta/Facebook
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metaAppSecret">App Secret</Label>
              <div className="relative">
                <Input
                  id="metaAppSecret"
                  type={showMetaSecret ? "text" : "password"}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={config.metaAppSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, metaAppSecret: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowMetaSecret(!showMetaSecret)}
                >
                  {showMetaSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Chave secreta do aplicativo
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="metaAccessToken">Token de Acesso</Label>
              <div className="relative">
                <Input
                  id="metaAccessToken"
                  type={showMetaToken ? "text" : "password"}
                  placeholder="EAAxxxxxxxxxx..."
                  value={config.metaAccessToken}
                  onChange={(e) => setConfig(prev => ({ ...prev, metaAccessToken: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowMetaToken(!showMetaToken)}
                >
                  {showMetaToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Token de acesso do Facebook Marketing API
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metaAdAccountId">ID da Conta de Anúncios</Label>
              <Input
                id="metaAdAccountId"
                placeholder="act_123456789 ou 123456789"
                value={config.metaAdAccountId}
                onChange={(e) => setConfig(prev => ({ ...prev, metaAdAccountId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                ID da conta de anúncios (com ou sem "act_")
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testMetaConnection}
              disabled={isTestingMeta}
            >
              {isTestingMeta ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isTestingMeta ? 'Testando...' : 'Testar e Conectar'}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a 
                href="https://developers.facebook.com/docs/marketing-api/overview" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                Documentação
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Google Ads Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <svg className="h-6 w-6 text-destructive" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg">Google Ads</CardTitle>
                <CardDescription>Configure a integração com Google Ads API</CardDescription>
              </div>
            </div>
            <Badge variant={config.isGoogleConnected ? "default" : "secondary"} className="gap-1">
              {config.isGoogleConnected ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Conectado
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Não conectado
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="googleClientId">Client ID</Label>
              <Input
                id="googleClientId"
                placeholder="123456789-abc123.apps.googleusercontent.com"
                value={config.googleClientId}
                onChange={(e) => setConfig(prev => ({ ...prev, googleClientId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                OAuth 2.0 Client ID do Google Cloud
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="googleClientSecret">Client Secret</Label>
              <div className="relative">
                <Input
                  id="googleClientSecret"
                  type={showGoogleSecret ? "text" : "password"}
                  placeholder="GOCSPX-xxxxxxxxxx"
                  value={config.googleClientSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, googleClientSecret: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                >
                  {showGoogleSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                OAuth 2.0 Client Secret
              </p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="googleRefreshToken">Refresh Token</Label>
              <Input
                id="googleRefreshToken"
                placeholder="1//0xxxxxxxxxx"
                value={config.googleRefreshToken}
                onChange={(e) => setConfig(prev => ({ ...prev, googleRefreshToken: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Token de atualização para acesso contínuo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleCustomerId">Customer ID</Label>
              <Input
                id="googleCustomerId"
                placeholder="123-456-7890"
                value={config.googleCustomerId}
                onChange={(e) => setConfig(prev => ({ ...prev, googleCustomerId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                ID da conta Google Ads (MCC ou conta individual)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleDeveloperToken">Developer Token</Label>
            <Input
              id="googleDeveloperToken"
              placeholder="xxxxxxxxxxxxxxxx"
              value={config.googleDeveloperToken}
              onChange={(e) => setConfig(prev => ({ ...prev, googleDeveloperToken: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Token de desenvolvedor do Google Ads API
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testGoogleConnection}
              disabled={isTestingGoogle}
            >
              {isTestingGoogle ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isTestingGoogle ? 'Testando...' : 'Testar e Conectar'}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a 
                href="https://developers.google.com/google-ads/api/docs/get-started/introduction" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                Documentação
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-600">Dica de Segurança</AlertTitle>
        <AlertDescription className="text-amber-600/80">
          As credenciais são enviadas diretamente para validação no servidor e não são armazenadas no navegador. 
          Use o botão "Testar e Conectar" para validar e ativar a integração automaticamente.
        </AlertDescription>
      </Alert>
    </div>
  );
}
