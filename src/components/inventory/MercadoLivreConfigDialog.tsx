import { useState } from 'react';
import { Store, Key, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MercadoLivreConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MercadoLivreConfigDialog({ open, onOpenChange }: MercadoLivreConfigDialogProps) {
  const [isActive, setIsActive] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  const handleSave = () => {
    if (!clientId || !clientSecret) {
      toast.error('Client ID e Client Secret são obrigatórios');
      return;
    }
    
    // Por enquanto apenas mostra sucesso - integração real virá depois
    toast.success('Configurações do Mercado Livre salvas!');
    onOpenChange(false);
  };

  const handleTestConnection = () => {
    if (!clientId || !clientSecret) {
      toast.error('Preencha Client ID e Client Secret primeiro');
      return;
    }
    toast.info('Funcionalidade de teste será implementada em breve');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-yellow-500" />
            Integração Mercado Livre
          </DialogTitle>
          <DialogDescription>
            Configure as credenciais da API do Mercado Livre para sincronizar seus veículos automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status da Integração */}
          <Card className={isActive ? 'border-green-500/50 bg-green-50/50 dark:bg-green-900/10' : 'border-dashed'}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isActive ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Status da Integração</p>
                    <p className="text-sm text-muted-foreground">
                      {isActive ? 'Ativa e sincronizando' : 'Desativada'}
                    </p>
                  </div>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>

          {/* Credenciais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Key className="h-4 w-4" />
              Credenciais da API
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID *</Label>
                <Input
                  id="client_id"
                  placeholder="Ex: 1234567890123456"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_secret">Client Secret *</Label>
                <Input
                  id="client_secret"
                  type="password"
                  placeholder="••••••••••••••••"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="access_token">Access Token</Label>
                <Input
                  id="access_token"
                  type="password"
                  placeholder="Token de acesso (opcional)"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Será gerado automaticamente após autenticação OAuth
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refresh_token">Refresh Token</Label>
                <Input
                  id="refresh_token"
                  type="password"
                  placeholder="Token de refresh (opcional)"
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Como obter as credenciais?</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Acesse o Portal de Desenvolvedores do Mercado Livre</li>
              <li>Crie ou selecione uma aplicação</li>
              <li>Copie o Client ID e Client Secret</li>
              <li>Configure o redirect URI para seu domínio</li>
            </ol>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleTestConnection}>
            Testar Conexão
          </Button>
          <Button onClick={handleSave}>
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
