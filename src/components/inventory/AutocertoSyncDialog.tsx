import { useState } from 'react';
import { Link2, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AutocertoSyncButtonProps {
  onSyncComplete?: () => void;
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface SyncResult {
  total: number;
  imported: number;
  updated: number;
  errors: number;
}

export function AutocertoSyncButton({ onSyncComplete }: AutocertoSyncButtonProps) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setStatus('syncing');
    setSyncResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('autocerto-sync', {
        body: { action: 'sync' },
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

      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setSyncResult(null);
      }, 5000);
    } catch (error: any) {
      console.error('Sync error:', error);
      setStatus('error');
      toast.error(error.message || 'Falha ao sincronizar estoque');

      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  if (status === 'success' && syncResult) {
    return (
      <Button variant="outline" className="gap-2 text-green-600 border-green-600">
        <CheckCircle className="h-4 w-4" />
        {syncResult.imported + syncResult.updated} veículos sincronizados
      </Button>
    );
  }

  if (status === 'error') {
    return (
      <Button variant="outline" className="gap-2 text-red-600 border-red-600" onClick={handleSync}>
        <AlertCircle className="h-4 w-4" />
        Tentar novamente
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleSync}
      disabled={status === 'syncing'}
      className="gap-2"
    >
      {status === 'syncing' ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Sincronizando...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Sincronizar Autocerto
        </>
      )}
    </Button>
  );
}

// Keep the old export for backwards compatibility
export function AutocertoSyncDialog({ open, onOpenChange, onSyncComplete }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncComplete?: () => void;
}) {
  // Just render the button when dialog opens
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-background p-6 rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Sincronizar Autocerto
        </h3>
        <p className="text-muted-foreground mb-4">
          As credenciais estão configuradas nos secrets do projeto.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <AutocertoSyncButton onSyncComplete={() => {
            onSyncComplete?.();
            onOpenChange(false);
          }} />
        </div>
      </div>
    </div>
  );
}
