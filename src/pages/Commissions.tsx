import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCommissionRules, useSaleCommissions, useDeleteCommissionRule } from '@/hooks/useCommissions';
import { CommissionRuleForm } from '@/components/commissions/CommissionRuleForm';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { commissionTypeLabels, type CommissionRule } from '@/types/sales';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';

export default function Commissions() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const { data: rules, isLoading } = useCommissionRules();
  const { data: commissions } = useSaleCommissions();
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

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const totalPending = commissions?.filter(c => !c.paid).reduce((sum, c) => sum + c.final_amount, 0) || 0;
  const totalPaid = commissions?.filter(c => c.paid).reduce((sum, c) => sum + c.final_amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comissões</h1>
          <p className="text-muted-foreground">Regras e pagamentos de comissão</p>
        </div>
        {isManager && (
          <Button onClick={() => { setEditingRule(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nova Regra
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissões Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-500">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissões Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4">
          {isLoading ? (
            <p>Carregando...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rules?.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {commissionTypeLabels[rule.commission_type]}
                    </p>
                    {rule.percentage_value && (
                      <p className="text-lg font-semibold">{rule.percentage_value}% do lucro</p>
                    )}
                    {rule.fixed_value && (
                      <p className="text-lg font-semibold">{formatCurrency(rule.fixed_value)}</p>
                    )}
                    {isManager && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(rule)}>
                          <Edit className="h-3 w-3 mr-1" /> Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(rule.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="space-y-4">
            {commissions?.map((comm) => (
              <Card key={comm.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{comm.user?.full_name || 'Vendedor'}</p>
                    <p className="text-sm text-muted-foreground">
                      {comm.commission_rule?.name || 'Comissão manual'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(comm.final_amount)}</p>
                    <Badge variant={comm.paid ? 'default' : 'secondary'}>
                      {comm.paid ? 'Pago' : 'Pendente'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {commissions?.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma comissão registrada
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <CommissionRuleForm open={formOpen} onOpenChange={setFormOpen} rule={editingRule} />
    </div>
  );
}
