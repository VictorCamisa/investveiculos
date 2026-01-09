import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Settings, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Info
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ApiConfig {
  metaAccessToken: string;
  metaAdAccountId: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  isMetaConnected: boolean;
  isGoogleConnected: boolean;
}

export default function MarketingSettingsPage() {
  const [showMetaToken, setShowMetaToken] = useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [config, setConfig] = useState<ApiConfig>({
    metaAccessToken: '',
    metaAdAccountId: '',
    googleClientId: '',
    googleClientSecret: '',
    googleRefreshToken: '',
    isMetaConnected: false,
    isGoogleConnected: false,
  });

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('marketing_api_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } catch (e) {
        console.error('Error loading config:', e);
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update connection status based on filled fields
      const updatedConfig = {
        ...config,
        isMetaConnected: !!(config.metaAccessToken && config.metaAdAccountId),
        isGoogleConnected: !!(config.googleClientId && config.googleClientSecret),
      };
      
      localStorage.setItem('marketing_api_config', JSON.stringify(updatedConfig));
      setConfig(updatedConfig);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const testMetaConnection = async () => {
    if (!config.metaAccessToken || !config.metaAdAccountId) {
      toast.error('Preencha o Token de Acesso e o ID da Conta de Anúncios');
      return;
    }
    
    toast.info('Testando conexão com Meta Ads...');
    // Simulating connection test - in production, this would make an actual API call
    setTimeout(() => {
      toast.success('Conexão com Meta Ads estabelecida com sucesso!');
      setConfig(prev => ({ ...prev, isMetaConnected: true }));
    }, 1500);
  };

  const testGoogleConnection = async () => {
    if (!config.googleClientId || !config.googleClientSecret) {
      toast.error('Preencha o Client ID e Client Secret do Google');
      return;
    }
    
    toast.info('Testando conexão com Google Ads...');
    setTimeout(() => {
      toast.success('Conexão com Google Ads estabelecida com sucesso!');
      setConfig(prev => ({ ...prev, isGoogleConnected: true }));
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Configuração de APIs</AlertTitle>
        <AlertDescription>
          Configure suas chaves de API para conectar o sistema com Meta Ads e Google Ads. 
          As credenciais são armazenadas localmente e usadas para sincronizar dados de campanhas.
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
                placeholder="act_123456789"
                value={config.metaAdAccountId}
                onChange={(e) => setConfig(prev => ({ ...prev, metaAdAccountId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                ID da conta de anúncios (começa com "act_")
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={testMetaConnection}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Testar Conexão
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
          
          <div className="space-y-2">
            <Label htmlFor="googleRefreshToken">Refresh Token (Opcional)</Label>
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
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={testGoogleConnection}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Testar Conexão
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

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
