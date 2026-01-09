import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FollowUpFlowCard } from '@/components/crm/FollowUpFlowCard';
import { FollowUpFlowForm } from '@/components/crm/FollowUpFlowForm';
import {
  useFollowUpFlows,
  useCreateFollowUpFlow,
  useUpdateFollowUpFlow,
  useDeleteFollowUpFlow,
  useToggleFollowUpFlow,
} from '@/hooks/useFollowUpFlows';
import { Plus, Search, Workflow, Zap } from 'lucide-react';

interface FlowFormData {
  id?: string;
  name: string;
  description?: string;
  is_active?: boolean;
  target_lead_status?: string[];
  target_lead_sources?: string[];
  target_vehicle_interests?: string;
  target_negotiation_status?: string[];
  trigger_type?: string;
  delay_days?: number;
  delay_hours?: number;
  specific_time?: string;
  days_of_week?: number[];
  message_template: string;
  include_vehicle_info?: boolean;
  include_salesperson_name?: boolean;
  include_company_name?: boolean;
  whatsapp_button_text?: string;
  min_days_since_last_contact?: number;
  max_contacts_per_lead?: number;
  exclude_converted_leads?: boolean;
  exclude_lost_leads?: boolean;
  priority?: number;
}

export default function FollowUps() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<FlowFormData | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const { data: flows, isLoading } = useFollowUpFlows();
  const createMutation = useCreateFollowUpFlow();
  const updateMutation = useUpdateFollowUpFlow();
  const deleteMutation = useDeleteFollowUpFlow();
  const toggleMutation = useToggleFollowUpFlow();

  const filteredFlows = flows?.filter((flow) => {
    const matchesSearch =
      flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'active') return matchesSearch && flow.is_active;
    if (activeTab === 'inactive') return matchesSearch && !flow.is_active;
    return matchesSearch;
  });

  const handleCreate = (data: FlowFormData) => {
    // The form already converts pipeline_stages to target_lead_status/target_negotiation_status
    // and target_vehicle_interests to an array
    createMutation.mutate(data as never, {
      onSuccess: () => setIsFormOpen(false),
    });
  };

  const handleUpdate = (data: FlowFormData) => {
    if (!editingFlow?.id) return;
    const payload = {
      id: editingFlow.id,
      ...data,
    };
    updateMutation.mutate(payload as never, {
      onSuccess: () => {
        setEditingFlow(null);
        setIsFormOpen(false);
      },
    });
  };

  const handleEdit = (flow: FlowFormData & { id: string }) => {
    setEditingFlow({
      ...flow,
      target_vehicle_interests: Array.isArray(flow.target_vehicle_interests)
        ? (flow.target_vehicle_interests as unknown as string[]).join(', ')
        : flow.target_vehicle_interests,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleToggle = (id: string, is_active: boolean) => {
    toggleMutation.mutate({ id, is_active });
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingFlow(null);
  };

  const activeCount = flows?.filter((f) => f.is_active).length || 0;
  const inactiveCount = flows?.filter((f) => !f.is_active).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Workflow className="h-6 w-6" />
            Follow-ups WhatsApp
          </h1>
          <p className="text-muted-foreground">
            Crie e gerencie fluxos de follow-up automatizados para WhatsApp
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Fluxo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Workflow className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Fluxos</p>
            <p className="text-2xl font-bold">{flows?.length || 0}</p>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fluxos Ativos</p>
            <p className="text-2xl font-bold">{activeCount}</p>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Workflow className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fluxos Inativos</p>
            <p className="text-2xl font-bold">{inactiveCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fluxos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos ({flows?.length || 0})</TabsTrigger>
            <TabsTrigger value="active">Ativos ({activeCount})</TabsTrigger>
            <TabsTrigger value="inactive">Inativos ({inactiveCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Flows Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredFlows?.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-lg">
          <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Nenhum fluxo encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? 'Tente ajustar sua busca'
              : 'Crie seu primeiro fluxo de follow-up para WhatsApp'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Fluxo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFlows?.map((flow) => (
            <FollowUpFlowCard
              key={flow.id}
              flow={flow}
              onEdit={handleEdit as never}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFlow ? 'Editar Fluxo de Follow-up' : 'Novo Fluxo de Follow-up'}
            </DialogTitle>
          </DialogHeader>
          <FollowUpFlowForm
            initialData={editingFlow || undefined}
            onSubmit={editingFlow ? handleUpdate : handleCreate}
            onCancel={handleCloseForm}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
