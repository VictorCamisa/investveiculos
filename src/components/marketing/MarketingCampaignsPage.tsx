import { useState } from 'react';
import { Plus, Target, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMarketingCampaigns, useDeleteCampaign } from '@/hooks/useMarketing';
import { CampaignCard } from '@/components/marketing/CampaignCard';
import { CampaignForm } from '@/components/marketing/CampaignForm';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { BentoCard } from '@/components/ui/bento-card';
import type { MarketingCampaign } from '@/types/marketing';

export default function MarketingCampaignsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const { data: campaigns, isLoading } = useMarketingCampaigns();
  const deleteCampaign = useDeleteCampaign();
  const { role } = useAuth();

  const canEdit = role === 'gerente' || role === 'marketing';
  const canDelete = role === 'gerente';

  const handleEdit = (campaign: MarketingCampaign) => {
    setEditingCampaign(campaign);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta campanha?')) {
      await deleteCampaign.mutateAsync(id);
    }
  };

  // Calculate KPIs
  const activeCampaigns = campaigns?.filter(c => c.is_active) || [];
  const totalBudget = campaigns?.reduce((sum, c) => sum + (c.budget || 0), 0) || 0;
  const totalSpent = campaigns?.reduce((sum, c) => sum + (c.spent || 0), 0) || 0;
  const budgetUtilization = totalBudget > 0 ? ((totalSpent / totalBudget) * 100) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        {canEdit && (
          <Button onClick={() => { setEditingCampaign(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nova Campanha
          </Button>
        )}
      </div>

      {/* KPIs with BentoCards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BentoCard
          title="Campanhas Ativas"
          value={activeCampaigns.length}
          subtitle={`${campaigns?.length || 0} campanhas no total`}
          colors={["#E53935", "#EF5350", "#E57373"]}
          delay={0}
          icon={<Target className="h-5 w-5 text-muted-foreground" />}
        />
        <BentoCard
          title="Orçamento Total"
          value={formatCurrency(totalBudget)}
          subtitle="Soma de todas campanhas"
          colors={["#D32F2F", "#E53935", "#EF5350"]}
          delay={0.1}
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
        />
        <BentoCard
          title="Total Gasto"
          value={formatCurrency(totalSpent)}
          subtitle="Investimento realizado"
          colors={["#C62828", "#D32F2F", "#E53935"]}
          delay={0.2}
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
        />
        <BentoCard
          title="Utilização do Orçamento"
          value={`${budgetUtilization.toFixed(1)}%`}
          subtitle="Gasto vs orçamento"
          colors={["#B71C1C", "#C62828", "#D32F2F"]}
          delay={0.3}
          icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns?.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
            />
          ))}
          {campaigns?.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">
              Nenhuma campanha cadastrada
            </p>
          )}
        </div>
      )}

      <CampaignForm open={formOpen} onOpenChange={setFormOpen} campaign={editingCampaign} />
    </div>
  );
}
