import { useState } from 'react';
import { useNegotiations } from '@/hooks/useNegotiations';
import { 
  useVehicleInterestAlerts, 
  useCreateVehicleInterestAlert,
  useUpdateVehicleInterestAlert,
  useDeleteVehicleInterestAlert,
  useMatchingVehicles,
  VehicleInterestAlert 
} from '@/hooks/useVehicleInterestAlerts';
import {
  useLossRecoveryRules,
  useCreateLossRecoveryRule,
  useUpdateLossRecoveryRule,
  useDeleteLossRecoveryRule,
  useToggleLossRecoveryRule,
  LossRecoveryRule,
} from '@/hooks/useLossRecoveryRules';
import { LossRecoveryRuleForm } from '@/components/crm/LossRecoveryRuleForm';
import { LossRecoveryRuleCard } from '@/components/crm/LossRecoveryRuleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  XCircle, 
  Phone, 
  User, 
  Car, 
  Calendar,
  MessageCircle,
  Bell,
  BellOff,
  Check,
  Trash2,
  Plus,
  Workflow,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { lossReasonLabels, LossReasonType, Negotiation } from '@/types/negotiations';

// Status labels for alerts
const alertStatusLabels: Record<string, string> = {
  active: 'Aguardando',
  notified: 'Notificado',
  expired: 'Expirado',
  converted: 'Convertido',
};

const alertStatusColors: Record<string, string> = {
  active: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  notified: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  converted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

export default function LostNegotiations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('perdas');
  const [selectedReason, setSelectedReason] = useState<LossReasonType | 'all'>('all');
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<VehicleInterestAlert | null>(null);
  const [showMatchingVehicles, setShowMatchingVehicles] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<LossRecoveryRule | null>(null);

  // Queries
  const { data: negotiations = [], isLoading: isLoadingNegotiations } = useNegotiations();
  const { data: alerts = [], isLoading: isLoadingAlerts } = useVehicleInterestAlerts();
  const { data: matchingVehicles = [] } = useMatchingVehicles(showMatchingVehicles ? selectedAlert : null);
  const { data: rules = [], isLoading: isLoadingRules } = useLossRecoveryRules();

  // Mutations - Alerts
  const createAlert = useCreateVehicleInterestAlert();
  const updateAlert = useUpdateVehicleInterestAlert();
  const deleteAlert = useDeleteVehicleInterestAlert();

  // Mutations - Rules
  const createRule = useCreateLossRecoveryRule();
  const updateRule = useUpdateLossRecoveryRule();
  const deleteRule = useDeleteLossRecoveryRule();
  const toggleRule = useToggleLossRecoveryRule();

  // Filter only lost negotiations
  const lostNegotiations = negotiations.filter(n => n.status === 'perdido');

  // Filter by search and reason
  const filteredNegotiations = lostNegotiations.filter(n => {
    const matchesSearch = 
      n.lead?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.lead?.phone.includes(searchTerm) ||
      n.vehicle?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesReason = selectedReason === 'all' || n.structured_loss_reason === selectedReason;
    
    return matchesSearch && matchesReason;
  });

  // Filter alerts by search
  const filteredAlerts = alerts.filter(a => 
    a.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.customer_phone.includes(searchTerm) ||
    a.vehicle_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter rules by search
  const filteredRules = rules.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const activeAlerts = alerts.filter(a => a.status === 'active').length;
  const activeRules = rules.filter(r => r.is_active).length;
  const reasonCounts = lostNegotiations.reduce((acc, n) => {
    const reason = n.structured_loss_reason || 'outros';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleCreateAlertFromNegotiation = (negotiation: Negotiation) => {
    if (!negotiation.lead) return;
    
    createAlert.mutate({
      lead_id: negotiation.lead_id,
      negotiation_id: negotiation.id,
      customer_name: negotiation.lead.name,
      customer_phone: negotiation.lead.phone,
      customer_email: negotiation.lead.email || undefined,
      vehicle_brand: negotiation.vehicle?.brand,
      vehicle_model: negotiation.vehicle?.model,
      year_min: negotiation.vehicle?.year_model ? negotiation.vehicle.year_model - 1 : undefined,
      year_max: negotiation.vehicle?.year_model ? negotiation.vehicle.year_model + 1 : undefined,
      price_min: negotiation.vehicle?.sale_price ? negotiation.vehicle.sale_price * 0.8 : undefined,
      price_max: negotiation.vehicle?.sale_price ? negotiation.vehicle.sale_price * 1.2 : undefined,
    });
    setShowCreateAlert(false);
    setSelectedNegotiation(null);
  };

  const handleOpenWhatsApp = (phone: string, vehicleName?: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = vehicleName 
      ? `Olá! Temos uma novidade para você: acabou de chegar um ${vehicleName} que pode ser do seu interesse! Gostaria de saber mais?`
      : 'Olá! Temos novidades que podem ser do seu interesse!';
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleMarkAsNotified = (alert: VehicleInterestAlert, vehicleId?: string) => {
    updateAlert.mutate({
      id: alert.id,
      status: 'notified',
      notified_at: new Date().toISOString(),
      notified_vehicle_id: vehicleId,
    });
    setShowMatchingVehicles(false);
    setSelectedAlert(null);
  };

  const handleCreateRule = (data: Parameters<typeof createRule.mutate>[0]) => {
    createRule.mutate(data, {
      onSuccess: () => {
        setShowRuleForm(false);
        setEditingRule(null);
      },
    });
  };

  const handleUpdateRule = (data: Parameters<typeof updateRule.mutate>[0]) => {
    if (!editingRule) return;
    updateRule.mutate({ id: editingRule.id, ...data }, {
      onSuccess: () => {
        setShowRuleForm(false);
        setEditingRule(null);
      },
    });
  };

  const handleEditRule = (rule: LossRecoveryRule) => {
    setEditingRule(rule);
    setShowRuleForm(true);
  };

  const handleCloseRuleForm = () => {
    setShowRuleForm(false);
    setEditingRule(null);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <XCircle className="h-6 w-6 text-destructive" />
            Negociações Perdidas
          </h1>
          <p className="text-muted-foreground">
            Analise motivos de perda e crie automações de reengajamento
          </p>
        </div>
        {activeTab === 'automacoes' && (
          <Button onClick={() => setShowRuleForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Regra
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{lostNegotiations.length}</div>
            <p className="text-sm text-muted-foreground">Total Perdidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeRules}</div>
            <p className="text-sm text-muted-foreground">Regras Ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeAlerts}</div>
            <p className="text-sm text-muted-foreground">Alertas Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{reasonCounts['veiculo_vendido'] || 0}</div>
            <p className="text-sm text-muted-foreground">Veículo Vendido</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="perdas">Perdas ({lostNegotiations.length})</TabsTrigger>
            <TabsTrigger value="automacoes">
              <Workflow className="h-4 w-4 mr-1" />
              Automações ({rules.length})
            </TabsTrigger>
            <TabsTrigger value="alertas">Alertas ({alerts.length})</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {activeTab === 'perdas' && (
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value as LossReasonType | 'all')}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Todos os motivos</option>
                {Object.entries(lossReasonLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Lost Negotiations Tab */}
        <TabsContent value="perdas" className="mt-4">
          {isLoadingNegotiations ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : filteredNegotiations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Nenhuma negociação perdida encontrada</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedReason !== 'all' 
                    ? 'Tente ajustar os filtros' 
                    : 'Suas negociações perdidas aparecerão aqui'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredNegotiations.map(negotiation => (
                <Card key={negotiation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium truncate">{negotiation.lead?.name || 'Lead removido'}</span>
                          {negotiation.structured_loss_reason && (
                            <Badge variant="destructive">
                              {lossReasonLabels[negotiation.structured_loss_reason]}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          {negotiation.lead?.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {negotiation.lead.phone}
                            </div>
                          )}
                          
                          {negotiation.vehicle && (
                            <div className="flex items-center gap-2">
                              <Car className="h-3 w-3" />
                              {negotiation.vehicle.brand} {negotiation.vehicle.model} {negotiation.vehicle.year_model}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Perdido em {format(new Date(negotiation.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>

                        {negotiation.loss_reason && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            "{negotiation.loss_reason}"
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {negotiation.lead?.phone && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOpenWhatsApp(negotiation.lead!.phone)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            WhatsApp
                          </Button>
                        )}
                        
                        {negotiation.structured_loss_reason === 'veiculo_vendido' && negotiation.lead && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedNegotiation(negotiation);
                              setShowCreateAlert(true);
                            }}
                          >
                            <Bell className="h-4 w-4 mr-1" />
                            Criar Alerta
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automacoes" className="mt-4">
          {isLoadingRules ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : filteredRules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Nenhuma regra de automação</h3>
                <p className="text-muted-foreground mb-4">
                  Crie regras para automatizar ações baseadas no motivo de perda
                </p>
                <Button onClick={() => setShowRuleForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeira Regra
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredRules.map(rule => (
                <LossRecoveryRuleCard
                  key={rule.id}
                  rule={rule}
                  onEdit={handleEditRule}
                  onDelete={(id) => deleteRule.mutate(id)}
                  onToggle={(id, is_active) => toggleRule.mutate({ id, is_active })}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Vehicle Alerts Tab */}
        <TabsContent value="alertas" className="mt-4">
          {isLoadingAlerts ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Nenhum alerta cadastrado</h3>
                <p className="text-muted-foreground">
                  Crie alertas a partir de negociações perdidas por "Veículo já vendido"
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredAlerts.map(alert => (
                <Card key={alert.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium truncate">{alert.customer_name}</span>
                          <Badge className={alertStatusColors[alert.status]}>
                            {alertStatusLabels[alert.status]}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {alert.customer_phone}
                          </div>
                          
                          {(alert.vehicle_brand || alert.vehicle_model) && (
                            <div className="flex items-center gap-2">
                              <Car className="h-3 w-3" />
                              {[alert.vehicle_brand, alert.vehicle_model].filter(Boolean).join(' ')}
                              {(alert.year_min || alert.year_max) && (
                                <span className="text-xs">
                                  ({alert.year_min || '?'} - {alert.year_max || '?'})
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Criado em {format(new Date(alert.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {alert.status === 'active' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedAlert(alert);
                                setShowMatchingVehicles(true);
                              }}
                            >
                              <Car className="h-4 w-4 mr-1" />
                              Ver Veículos
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleOpenWhatsApp(alert.customer_phone)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              WhatsApp
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => updateAlert.mutate({ id: alert.id, status: 'expired' })}
                            >
                              <BellOff className="h-4 w-4 mr-1" />
                              Expirar
                            </Button>
                          </>
                        )}
                        
                        {alert.status === 'notified' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateAlert.mutate({ id: alert.id, status: 'converted' })}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Converteu
                          </Button>
                        )}

                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteAlert.mutate(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Alert Dialog */}
      <Dialog open={showCreateAlert} onOpenChange={setShowCreateAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Alerta de Veículo</DialogTitle>
          </DialogHeader>
          {selectedNegotiation && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Será criado um alerta para <strong>{selectedNegotiation.lead?.name}</strong> quando 
                entrar um veículo semelhante a{' '}
                <strong>
                  {selectedNegotiation.vehicle?.brand} {selectedNegotiation.vehicle?.model} {selectedNegotiation.vehicle?.year_model}
                </strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                O sistema buscará veículos com ano ±1 e preço ±20% do original.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateAlert(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedNegotiation && handleCreateAlertFromNegotiation(selectedNegotiation)}
              disabled={createAlert.isPending}
            >
              Criar Alerta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Matching Vehicles Dialog */}
      <Dialog open={showMatchingVehicles} onOpenChange={setShowMatchingVehicles}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Veículos Disponíveis</DialogTitle>
            {selectedAlert && (
              <p className="text-sm text-muted-foreground">
                Critérios: {[selectedAlert.vehicle_brand, selectedAlert.vehicle_model].filter(Boolean).join(' ') || 'Qualquer'}
                {selectedAlert.year_min && ` • A partir de ${selectedAlert.year_min}`}
                {selectedAlert.price_max && ` • Até ${formatCurrency(selectedAlert.price_max)}`}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {matchingVehicles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum veículo disponível corresponde aos critérios.</p>
              </div>
            ) : (
              matchingVehicles.map(vehicle => (
                <Card key={vehicle.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                                    {vehicle.images?.[0] ? (
                                        <img 
                                          src={vehicle.images[0]} 
                                          alt={`${vehicle.brand} ${vehicle.model}`}
                                          className="w-16 h-12 object-cover rounded"
                                        />
                                      ) : (
                                        <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                                          <Car className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                      )}
                      <div>
                        <p className="font-medium">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.year_model} • {formatCurrency(vehicle.sale_price)}
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (selectedAlert) {
                          handleOpenWhatsApp(
                            selectedAlert.customer_phone,
                            `${vehicle.brand} ${vehicle.model} ${vehicle.year_model}`
                          );
                          handleMarkAsNotified(selectedAlert, vehicle.id);
                        }
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Notificar
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMatchingVehicles(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rule Form Dialog */}
      <Dialog open={showRuleForm} onOpenChange={handleCloseRuleForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Editar Regra de Automação' : 'Nova Regra de Automação'}
            </DialogTitle>
          </DialogHeader>
          <LossRecoveryRuleForm
            initialData={editingRule || undefined}
            onSubmit={(data) => editingRule ? handleUpdateRule({ ...data, id: editingRule.id }) : handleCreateRule(data)}
            onCancel={handleCloseRuleForm}
            isLoading={createRule.isPending || updateRule.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
