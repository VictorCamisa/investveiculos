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
  processed: number;
  imported: number;
  updated: number;
  removed: number;
  errors: number;
}

export function AutocertoSyncButton({ onSyncComplete }: AutocertoSyncButtonProps) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);

  const syncBatch = async (offset: number = 0): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('autocerto-sync', {
      body: { action: 'sync', offset },
    });

    if (error) {
      throw error;
    }

    if (data.error) {
      throw new Error(data.error);
    }

    // Update progress
    setProgress({ processed: data.stats.processed, total: data.stats.total });
    
    // Accumulate results
    setSyncResult(prev => ({
      total: data.stats.total,
      processed: data.stats.processed,
      imported: (prev?.imported || 0) + data.stats.imported,
      updated: (prev?.updated || 0) + data.stats.updated,
      removed: (prev?.removed || 0) + (data.stats.removed || 0),
      errors: (prev?.errors || 0) + data.stats.errors,
    }));

    // If there's more to process, continue
    if (data.hasMore && data.nextOffset !== null) {
      await syncBatch(data.nextOffset);
    }
  };

  const handleSync = async () => {
    setStatus('syncing');
    setSyncResult(null);
    setProgress(null);

    try {
      await syncBatch(0);

      setStatus('success');
      toast.success(`Sincronização concluída!`);
      onSyncComplete?.();

      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setSyncResult(null);
        setProgress(null);
      }, 5000);
    } catch (error: unknown) {
      console.error('Sync error:', error);
      setStatus('error');
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar estoque';
      toast.error(message);

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
          {progress ? `${progress.processed}/${progress.total}...` : 'Sincronizando...'}
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
