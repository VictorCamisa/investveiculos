import { useState } from 'react';
import { Plus, Edit, Trash2, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCommissionRules, useDeleteCommissionRule } from '@/hooks/useCommissionsComplete';
import { CommissionRuleFormComplete } from './CommissionRuleFormComplete';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { commissionTypeLabels, type CommissionRule } from '@/types/commissions';

const formatCurrency = (value: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function CommissionRulesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const { data: rules, isLoading } = useCommissionRules();
  const deleteRule = useDeleteCommissionRule();
  const { role } = useAuth();

  const isManager = role === 'gerente';

  const handleEdit = (rule: CommissionRule) => {
    setEditingRule(rule);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta regra?')) {
      await deleteRule.mutateAsync(id);
    }
  };

  const handleNewRule = () => {
    setEditingRule(null);
    setFormOpen(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Regras de Comissão</h2>
          <p className="text-sm text-muted-foreground">Configure as regras automáticas de cálculo</p>
        </div>
        {isManager && (
          <Button onClick={handleNewRule}>
            <Plus className="h-4 w-4 mr-2" /> Nova Regra
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rules?.map((rule) => (
          <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${rule.is_active ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                </div>
                <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                  {rule.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {commissionTypeLabels[rule.commission_type]}
                </p>
                {rule.percentage_value ? (
                  <p className="text-lg font-semibold text-primary">{rule.percentage_value}% do lucro</p>
                ) : null}
                {rule.fixed_value ? (
                  <p className="text-lg font-semibold text-green-500">{formatCurrency(rule.fixed_value)}</p>
                ) : null}
              </div>

              {/* Conditions */}
              <div className="flex flex-wrap gap-1">
                {rule.min_vehicle_price ? (
                  <Badge variant="outline" className="text-xs">
                    Min: {formatCurrency(rule.min_vehicle_price)}
                  </Badge>
                ) : null}
                {rule.max_vehicle_price ? (
                  <Badge variant="outline" className="text-xs">
                    Max: {formatCurrency(rule.max_vehicle_price)}
                  </Badge>
                ) : null}
                {rule.min_profit_margin ? (
                  <Badge variant="outline" className="text-xs">
                    Margem ≥ {rule.min_profit_margin}%
                  </Badge>
                ) : null}
                {rule.min_days_in_stock || rule.max_days_in_stock ? (
                  <Badge variant="outline" className="text-xs">
                    {rule.min_days_in_stock || 0}-{rule.max_days_in_stock || '∞'} dias
                  </Badge>
                ) : null}
              </div>

              {rule.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{rule.description}</p>
              )}

              <div className="flex items-center justify-between pt-2">
                <Badge variant="secondary" className="text-xs">
                  Prioridade: {rule.priority}
                </Badge>
                {isManager && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(rule)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(rule.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {rules?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhuma regra de comissão cadastrada
          </div>
        )}
      </div>

      <CommissionRuleFormComplete open={formOpen} onOpenChange={setFormOpen} rule={editingRule} />
    </div>
  );
}
