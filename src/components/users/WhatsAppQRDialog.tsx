import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { useUserWhatsAppInstance, useRefreshQRCode } from '@/hooks/useWhatsApp';
import { toast } from 'sonner';

interface WhatsAppQRDialogProps {
  userId: string;
  instanceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppQRDialog({ userId, instanceId, open, onOpenChange }: WhatsAppQRDialogProps) {
  const { data: instance, refetch } = useUserWhatsAppInstance(userId);
  const refreshQR = useRefreshQRCode();

  // Poll every 3 seconds to check connection status
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      refetch();
    }, 3000);

    return () => clearInterval(interval);
  }, [open, refetch]);

  // Close dialog when connected
  useEffect(() => {
    if (instance?.status === 'connected' && open) {
      toast.success('WhatsApp conectado com sucesso!');
      onOpenChange(false);
    }
  }, [instance?.status, open, onOpenChange]);

  const handleRefreshQR = async () => {
    try {
      await refreshQR.mutateAsync(instanceId);
      refetch();
    } catch (error) {
      console.error('Error refreshing QR:', error);
    }
  };

  // Check if QR code expired
  const isQRExpired = instance?.qr_code_expires_at 
    ? new Date(instance.qr_code_expires_at) < new Date() 
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code com o WhatsApp do vendedor para conectar ao sistema
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          {instance?.status === 'connected' ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-lg font-medium text-green-600">Conectado!</p>
            </div>
          ) : instance?.qr_code && !isQRExpired ? (
            <>
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={instance.qr_code.startsWith('data:') ? instance.qr_code : `data:image/png;base64,${instance.qr_code}`} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Abra o WhatsApp no celular → Configurações → Aparelhos conectados → Conectar um aparelho
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {isQRExpired ? 'QR Code expirado' : 'Gerando QR Code...'}
              </p>
              <Button 
                variant="outline" 
                onClick={handleRefreshQR}
                disabled={refreshQR.isPending}
              >
                {refreshQR.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isQRExpired ? 'Gerar Novo QR Code' : 'Atualizar'}
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Aguardando leitura do QR Code...</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshQR}
            disabled={refreshQR.isPending}
            className="h-7"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${refreshQR.isPending ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
