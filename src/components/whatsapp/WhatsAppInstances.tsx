import React, { useState } from 'react';
import { Plus, QrCode, Wifi, WifiOff, RefreshCw, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  useWhatsAppInstances, 
  useCreateWhatsAppInstance, 
  useDeleteWhatsAppInstance,
  useUpdateWhatsAppInstance,
  useWhatsAppInstanceAction,
  useSyncInstanceStatus
} from '@/hooks/useWhatsApp';
import { instanceStatusLabels, instanceStatusColors } from '@/types/whatsapp';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function WhatsAppInstances() {
  const { data: instances, isLoading } = useWhatsAppInstances();
  const createInstance = useCreateWhatsAppInstance();
  const deleteInstance = useDeleteWhatsAppInstance();
  const updateInstance = useUpdateWhatsAppInstance();
  const instanceAction = useWhatsAppInstanceAction();
  const syncStatus = useSyncInstanceStatus();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fixed Evolution API credentials
  const FIXED_API_URL = 'https://vssolutions-evolution-api.fjsxhg.easypanel.host/';
  const FIXED_API_KEY = 'E53F2CE050E7-4D35-BE93-D506BFEF9BA0';
  
  const [formData, setFormData] = useState({
    name: '',
    instance_name: '',
    api_url: FIXED_API_URL,
    api_key: FIXED_API_KEY,
    is_default: false,
    is_shared: false,
    signature_template: '👤 {nome} está te atendendo',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.instance_name || !formData.api_url || !formData.api_key) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      // 1. Save to database
      const newInstance = await createInstance.mutateAsync(formData);
      
      // 2. Automatically create in Evolution API
      if (newInstance?.id) {
        toast.info('Criando instância na Evolution API...');
        await instanceAction.mutateAsync({ action: 'create', instanceId: newInstance.id });
        await instanceAction.mutateAsync({ action: 'setWebhook', instanceId: newInstance.id });
        await instanceAction.mutateAsync({ action: 'connect', instanceId: newInstance.id });
        toast.success('Instância criada! Escaneie o QR Code.');
      }
      
      setDialogOpen(false);
      setFormData({
        name: '',
        instance_name: '',
        api_url: FIXED_API_URL,
        api_key: FIXED_API_KEY,
        is_default: false,
        is_shared: false,
        signature_template: '👤 {nome} está te atendendo',
      });
    } catch (error) {
      console.error('Error creating instance:', error);
      toast.error('Erro ao criar instância');
    }
  };

  const handleGenerateQRCode = async (instanceId: string) => {
    try {
      // First create instance in Evolution API if needed, then connect
      await instanceAction.mutateAsync({ action: 'create', instanceId });
      await instanceAction.mutateAsync({ action: 'setWebhook', instanceId });
      await instanceAction.mutateAsync({ action: 'connect', instanceId });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleCheckStatus = async (instanceId: string) => {
    await syncStatus.mutateAsync(instanceId);
  };

  const handleLogout = async (instanceId: string) => {
    await instanceAction.mutateAsync({ action: 'logout', instanceId });
  };

  // Auto-sync status every 5 seconds for instances not connected
  React.useEffect(() => {
    if (!instances?.length) return;

    const nonConnectedInstances = instances.filter(
      (i) => i.status !== 'connected' && i.status !== 'disconnected'
    );

    if (nonConnectedInstances.length === 0) return;

    const interval = setInterval(() => {
      nonConnectedInstances.forEach((instance) => {
        syncStatus.mutate(instance.id);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [instances]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Instâncias Evolution API</h2>
          <p className="text-sm text-muted-foreground">
            Configure a conexão com sua VPS
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Instância
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Instância WhatsApp</DialogTitle>
              <DialogDescription>
                Configure a conexão com sua VPS do Evolution API
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Instância *</Label>
                <Input
                  id="name"
                  placeholder="Ex: WhatsApp Principal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instance_name">Nome na Evolution API *</Label>
                <Input
                  id="instance_name"
                  placeholder="Ex: matheus-veiculos-1"
                  value={formData.instance_name}
                  onChange={(e) => setFormData({ ...formData, instance_name: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Nome único usado na Evolution API (sem espaços)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api_url">URL da Evolution API</Label>
                <Input
                  id="api_url"
                  value={formData.api_url}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  URL fixa da Evolution API
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Chave de API fixa
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="is_default">Instância Padrão</Label>
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_shared">Compartilhar com Equipe</Label>
                  <p className="text-xs text-muted-foreground">
                    Permite outros vendedores usarem esta instância
                  </p>
                </div>
                <Switch
                  id="is_shared"
                  checked={formData.is_shared}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_shared: checked })}
                />
              </div>
              
              {formData.is_shared && (
                <div className="space-y-2">
                  <Label htmlFor="signature_template">Assinatura de Mensagem</Label>
                  <Input
                    id="signature_template"
                    placeholder="👤 {nome} está te atendendo"
                    value={formData.signature_template}
                    onChange={(e) => setFormData({ ...formData, signature_template: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {'{nome}'} para inserir o nome do vendedor automaticamente
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createInstance.isPending}>
                  {createInstance.isPending ? 'Criando...' : 'Criar Instância'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-5 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !instances?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <QrCode className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Nenhuma instância configurada</h3>
            <p className="text-muted-foreground text-center max-w-md mt-2">
              Configure sua primeira instância do Evolution API para começar a usar o WhatsApp integrado.
            </p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Configurar Instância
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((instance) => (
            <Card key={instance.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{instance.name}</CardTitle>
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "text-white",
                      instanceStatusColors[instance.status]
                    )}
                  >
                    {instance.status === 'connected' ? (
                      <Wifi className="h-3 w-3 mr-1" />
                    ) : (
                      <WifiOff className="h-3 w-3 mr-1" />
                    )}
                    {instanceStatusLabels[instance.status]}
                  </Badge>
                </div>
                <CardDescription>
                  {instance.phone_number || instance.instance_name}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* QR Code Area */}
                {instance.status === 'qr_code' && instance.qr_code ? (
                  <div className="aspect-square bg-white p-4 rounded-lg flex items-center justify-center">
                    <img 
                      src={instance.qr_code} 
                      alt="QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : instance.status === 'connected' ? (
                  <div className="aspect-square bg-green-50 dark:bg-green-950/30 rounded-lg flex flex-col items-center justify-center p-4">
                    <Wifi className="h-12 w-12 text-green-500 mb-2" />
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Conectado
                    </p>
                    {instance.phone_number && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {instance.phone_number}
                      </p>
                    )}
                  </div>
                ) : instance.status === 'connecting' ? (
                  <div className="aspect-square bg-yellow-50 dark:bg-yellow-950/30 rounded-lg flex flex-col items-center justify-center p-4">
                    <RefreshCw className="h-12 w-12 text-yellow-500 mb-2 animate-spin" />
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                      Conectando...
                    </p>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Clique em "Gerar QR Code" para obter o código
                    </p>
                  </div>
                ) : (
                  <div className="aspect-square bg-muted/50 rounded-lg flex flex-col items-center justify-center p-4">
                    <QrCode className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Clique em "Gerar QR Code" para conectar
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {(instance.status === 'disconnected' || instance.status === 'connecting') && (
                    <Button 
                      className="flex-1" 
                      onClick={() => handleGenerateQRCode(instance.id)}
                      disabled={instanceAction.isPending}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {instanceAction.isPending ? 'Gerando...' : 'Gerar QR Code'}
                    </Button>
                  )}
                  
                  {instance.status === 'qr_code' && (
                    <Button 
                      className="flex-1" 
                      variant="outline"
                      onClick={() => handleGenerateQRCode(instance.id)}
                      disabled={instanceAction.isPending}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar QR
                    </Button>
                  )}

                  {instance.status === 'connected' && (
                    <Button 
                      className="flex-1" 
                      variant="outline"
                      onClick={() => updateInstance.mutate({ id: instance.id, status: 'disconnected' })}
                    >
                      <WifiOff className="h-4 w-4 mr-2" />
                      Desconectar
                    </Button>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover instância?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. A instância "{instance.name}" será removida permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteInstance.mutate(instance.id)}
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="flex flex-wrap gap-1 justify-center">
                  {instance.is_default && (
                    <Badge variant="outline" className="text-xs">
                      Padrão
                    </Badge>
                  )}
                  {instance.is_shared && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Compartilhada
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
