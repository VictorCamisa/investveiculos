import { useState } from 'react';
import { Plus, LayoutGrid, List, Filter, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LeadCard } from '@/components/crm/LeadCard';
import { LeadForm } from '@/components/crm/LeadForm';
import { LeadDetailSheet } from '@/components/crm/LeadDetailSheet';
import { useLeads, useCreateLead, useDeleteLead } from '@/hooks/useLeads';
import { useCreateNegotiation } from '@/hooks/useNegotiations';
import type { Lead, LeadStatus, LeadSource } from '@/types/crm';
import { leadStatusLabels, leadSourceLabels, leadStatusColors } from '@/types/crm';
import { Skeleton } from '@/components/ui/skeleton';

type ViewMode = 'grid' | 'list';

export default function Leads() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadDetailOpen, setLeadDetailOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const { data: leads, isLoading } = useLeads();
  const createLead = useCreateLead();
  const deleteLead = useDeleteLead();
  const createNegotiation = useCreateNegotiation();

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  }) || [];

  const handleCreateLead = (data: {
    name: string;
    phone: string;
    source: LeadSource;
    email?: string;
    notes?: string;
    vehicle_interest?: string;
  }) => {
    createLead.mutate(data, {
      onSuccess: () => setIsCreateDialogOpen(false),
    });
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadDetailOpen(true);
  };

  const handleStartNegotiation = async (leadId: string, salespersonId?: string) => {
    await createNegotiation.mutateAsync({
      lead_id: leadId,
      salesperson_id: salespersonId || '',
      status: 'em_andamento',
    });
    setLeadDetailOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7" />
            Banco de Contatos
          </h1>
          <p className="text-muted-foreground">
            Todos os leads cadastrados no sistema
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Lead</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <LeadForm
                onSubmit={handleCreateLead}
                isLoading={createLead.isPending}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats bar */}
      {!isLoading && leads && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(leadStatusLabels).map(([status, label]) => {
            const count = leads.filter(l => l.status === status).length;
            if (count === 0) return null;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? 'all' : status as LeadStatus)}
                className={`transition-all ${statusFilter === status ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
              >
                <Badge
                  className={`${leadStatusColors[status as LeadStatus]} cursor-pointer hover:opacity-80`}
                >
                  {label} · {count}
                </Badge>
              </button>
            );
          })}
          {statusFilter !== 'all' && (
            <button onClick={() => setStatusFilter('all')} className="text-xs text-muted-foreground underline">
              limpar filtro
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select
            value={sourceFilter}
            onValueChange={(value) => setSourceFilter(value as LeadSource | 'all')}
          >
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as origens</SelectItem>
              {Object.entries(leadSourceLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-none border-0"
              onClick={() => setViewMode('grid')}
              title="Cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-none border-0"
              onClick={() => setViewMode('list')}
              title="Lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Count */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          {filteredLeads.length} {filteredLeads.length === 1 ? 'contato' : 'contatos'}
          {(statusFilter !== 'all' || sourceFilter !== 'all' || searchTerm) && ' (filtrado)'}
        </p>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => handleLeadClick(lead)}
            />
          ))}
          {filteredLeads.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Nenhum contato encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros ou criar um novo lead</p>
            </div>
          )}
        </div>
      ) : (
        /* List view */
        <div className="border rounded-lg overflow-hidden">
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Nenhum contato encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros ou criar um novo lead</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Nome</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Telefone</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Origem</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Interesse</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, i) => (
                  <tr
                    key={lead.id}
                    onClick={() => handleLeadClick(lead)}
                    className={`cursor-pointer hover:bg-muted/40 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
                  >
                    <td className="px-4 py-3 font-medium">{lead.name}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{lead.phone}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {leadSourceLabels[lead.source]}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${leadStatusColors[lead.status]} text-xs`}>
                        {leadStatusLabels[lead.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground truncate max-w-[200px]">
                      {lead.vehicle_interest || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        open={leadDetailOpen}
        onOpenChange={setLeadDetailOpen}
        onStartNegotiation={handleStartNegotiation}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>{leadToDelete?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (leadToDelete) {
                  deleteLead.mutate(leadToDelete.id, {
                    onSuccess: () => {
                      setLeadToDelete(null);
                      setSelectedLead(null);
                    },
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
