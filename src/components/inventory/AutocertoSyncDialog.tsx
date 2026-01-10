import { useState } from 'react';
import { Link2, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AutocertoSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncComplete?: () => void;
}

type SyncStatus = 'idle' | 'testing' | 'syncing' | 'success' | 'error';

interface SyncResult {
  total: number;
  imported: number;
  updated: number;
  errors: number;
}

export function AutocertoSyncDialog({ open, onOpenChange, onSyncComplete }: AutocertoSyncDialogProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTestConnection = async () => {
    if (!username || !password) {
      toast.error('Preencha usuário e senha');
      return;
    }

    setStatus('testing');
    setErrorMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('autocerto-sync', {
        body: { username, password, action: 'test' },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success('Conexão estabelecida com sucesso!');
      setStatus('idle');
    } catch (error: any) {
      console.error('Test connection error:', error);
      setErrorMessage(error.message || 'Falha ao testar conexão');
      setStatus('error');
      toast.error('Falha ao conectar com Autocerto');
    }
  };

  const handleSync = async () => {
    if (!username || !password) {
      toast.error('Preencha usuário e senha');
      return;
    }

    setStatus('syncing');
    setErrorMessage('');
    setSyncResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('autocerto-sync', {
        body: { username, password, action: 'sync' },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setSyncResult(data.stats);
      setStatus('success');
      toast.success(`Sincronização concluída! ${data.stats.imported} importados, ${data.stats.updated} atualizados`);
      onSyncComplete?.();
    } catch (error: any) {
      console.error('Sync error:', error);
      setErrorMessage(error.message || 'Falha ao sincronizar');
      setStatus('error');
      toast.error('Falha ao sincronizar estoque');
    }
  };

  const handleClose = () => {
    if (status !== 'syncing') {
      onOpenChange(false);
      // Reset state after close
      setTimeout(() => {
        setStatus('idle');
        setSyncResult(null);
        setErrorMessage('');
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Conectar Autocerto
          </DialogTitle>
          <DialogDescription>
            Insira suas credenciais da API do Autocerto para importar todo o estoque com fotos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Credentials Form */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário (E-mail)</Label>
              <Input
                id="username"
                type="email"
                placeholder="usuario@api.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={status === 'syncing'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === 'syncing'}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Status Display */}
          {status === 'testing' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Testando conexão...</span>
            </div>
          )}

          {status === 'syncing' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sincronizando estoque... Isso pode levar alguns minutos.</span>
            </div>
          )}

          {status === 'success' && syncResult && (
            <div className="rounded-lg border border-green-500/20 bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Sincronização concluída!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Total encontrado:</span>
                  <span className="ml-2 font-medium">{syncResult.total}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Importados:</span>
                  <span className="ml-2 font-medium text-green-600">{syncResult.imported}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Atualizados:</span>
                  <span className="ml-2 font-medium text-blue-600">{syncResult.updated}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Erros:</span>
                  <span className="ml-2 font-medium text-red-600">{syncResult.errors}</span>
                </div>
              </div>
            </div>
          )}

          {status === 'error' && errorMessage && (
            <div className="rounded-lg border border-red-500/20 bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={status === 'syncing' || status === 'testing' || !username || !password}
              className="flex-1"
            >
              {status === 'testing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar Conexão'
              )}
            </Button>

            <Button
              onClick={handleSync}
              disabled={status === 'syncing' || status === 'testing' || !username || !password}
              className="flex-1"
            >
              {status === 'syncing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Importar Estoque
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            A sincronização importará todos os veículos e fotos do Autocerto.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
