import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, QrCode, Loader2, Unplug, CheckCircle2 } from 'lucide-react';
import { useUserWhatsAppInstance, useActivateUserWhatsApp, useDisconnectUserWhatsApp, useSyncUserWhatsAppStatus } from '@/hooks/useWhatsApp';
import { WhatsAppQRDialog } from './WhatsAppQRDialog';
import type { UserWithRoles } from '@/types/users';

interface UserWhatsAppButtonProps {
  user: UserWithRoles;
}

export function UserWhatsAppButton({ user }: UserWhatsAppButtonProps) {
  const [showQrDialog, setShowQrDialog] = useState(false);
  const { data: instance, isLoading, refetch } = useUserWhatsAppInstance(user.id);
  const activateWhatsApp = useActivateUserWhatsApp();
  const disconnectWhatsApp = useDisconnectUserWhatsApp();
  const syncStatus = useSyncUserWhatsAppStatus();

  // Sync status when component mounts
  useEffect(() => {
    if (user.id && instance) {
      syncStatus.mutate(user.id);
    }
  }, [user.id, instance?.id]);

  const handleActivate = async () => {
    try {
      const result = await activateWhatsApp.mutateAsync(user.id);
      // If already connected, just refetch
      if (result.status === 'connected') {
        refetch();
      } else {
        setShowQrDialog(true);
      }
    } catch (error) {
      console.error('Error activating WhatsApp:', error);
    }
  };

  const handleDisconnect = async () => {
    if (!instance) return;
    try {
      await disconnectWhatsApp.mutateAsync(instance.id);
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
    }
  };

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  // Connected
  if (instance?.status === 'connected') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-green-600 border-green-600 gap-1 bg-green-50 dark:bg-green-950/30">
          <CheckCircle2 className="h-3 w-3" />
          Conectado
        </Badge>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 px-2 text-destructive hover:text-destructive"
          onClick={handleDisconnect}
          disabled={disconnectWhatsApp.isPending}
          title="Desconectar WhatsApp"
        >
          {disconnectWhatsApp.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Unplug className="h-3 w-3" />
          )}
        </Button>
      </div>
    );
  }

  // Waiting for QR Code scan
  if (instance?.status === 'qr_code') {
    return (
      <>
        <Button 
          size="sm" 
          variant="outline"
          className="h-7 gap-1"
          onClick={() => setShowQrDialog(true)}
        >
          <QrCode className="h-3 w-3" />
          Ver QR Code
        </Button>
        <WhatsAppQRDialog
          userId={user.id}
          instanceId={instance.id}
          open={showQrDialog}
          onOpenChange={setShowQrDialog}
        />
      </>
    );
  }

  // Disconnected or no instance
  return (
    <>
      <Button 
        size="sm" 
        variant="outline"
        className="h-7 gap-1"
        onClick={handleActivate}
        disabled={activateWhatsApp.isPending}
      >
        {activateWhatsApp.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <MessageCircle className="h-3 w-3" />
        )}
        Ativar WhatsApp
      </Button>
      {showQrDialog && instance && (
        <WhatsAppQRDialog
          userId={user.id}
          instanceId={instance.id}
          open={showQrDialog}
          onOpenChange={setShowQrDialog}
        />
      )}
    </>
  );
}
