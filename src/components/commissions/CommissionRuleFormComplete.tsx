import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCreateCommissionRule, useUpdateCommissionRule } from '@/hooks/useCommissionsComplete';
import { commissionTypeLabels, goalPeriodLabels, type CommissionRule } from '@/types/commissions';
import { useMarketingCampaigns } from '@/hooks/useMarketing';

const formSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  commission_type: z.enum(['percentual_lucro', 'valor_fixo', 'escalonada', 'mista']),
  percentage_value: z.coerce.number().optional(),
  fixed_value: z.coerce.number().optional(),
  min_vehicle_price: z.coerce.number().optional(),
  max_vehicle_price: z.coerce.number().optional(),
  min_profit_margin: z.coerce.number().optional(),
  min_days_in_stock: z.coerce.number().optional(),
  max_days_in_stock: z.coerce.number().optional(),
  campaign_id: z.string().optional(),
  goal_period: z.string().optional(),
  goal_target: z.coerce.number().optional(),
  is_active: z.boolean(),
  priority: z.coerce.number(),
});

type FormData = z.infer<typeof formSchema>;

interface CommissionRuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: CommissionRule | null;
}

export function CommissionRuleFormComplete({ open, onOpenChange, rule }: CommissionRuleFormProps) {
  const createRule = useCreateCommissionRule();
  const updateRule = useUpdateCommissionRule();
  const { data: campaigns } = useMarketingCampaigns();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      commission_type: 'percentual_lucro',
      percentage_value: 0,
      fixed_value: 0,
      min_vehicle_price: 0,
      max_vehicle_price: 0,
      min_profit_margin: 0,
      min_days_in_stock: 0,
      max_days_in_stock: 0,
      campaign_id: 'none',
      goal_period: 'monthly',
      goal_target: 0,
      is_active: true,
      priority: 0,
    },
  });

  // Reset form when rule changes
  React.useEffect(() => {
    if (rule) {
      form.reset({
        name: rule.name || '',
        description: rule.description || '',
        commission_type: rule.commission_type || 'percentual_lucro',
        percentage_value: rule.percentage_value || 0,
        fixed_value: rule.fixed_value || 0,
        min_vehicle_price: rule.min_vehicle_price || 0,
        max_vehicle_price: rule.max_vehicle_price || 0,
        min_profit_margin: rule.min_profit_margin || 0,
        min_days_in_stock: rule.min_days_in_stock || 0,
        max_days_in_stock: rule.max_days_in_stock || 0,
        campaign_id: rule.campaign_id || 'none',
        goal_period: rule.goal_period || 'monthly',
        goal_target: rule.goal_target || 0,
        is_active: rule.is_active ?? true,
        priority: rule.priority || 0,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        commission_type: 'percentual_lucro',
        percentage_value: 0,
        fixed_value: 0,
        min_vehicle_price: 0,
        max_vehicle_price: 0,
        min_profit_margin: 0,
        min_days_in_stock: 0,
        max_days_in_stock: 0,
        campaign_id: 'none',
        goal_period: 'monthly',
        goal_target: 0,
        is_active: true,
        priority: 0,
      });
    }
  }, [rule, form]);

  const commissionType = form.watch('commission_type');

  const onSubmit = async (data: FormData) => {
    const cleanData = {
      ...data,
      campaign_id: data.campaign_id === 'none' ? null : data.campaign_id || null,
      min_vehicle_price: data.min_vehicle_price || null,
      max_vehicle_price: data.max_vehicle_price || null,
      min_profit_margin: data.min_profit_margin || null,
      min_days_in_stock: data.min_days_in_stock || null,
      max_days_in_stock: data.max_days_in_stock || null,
      goal_target: data.goal_target || null,
    };

    if (rule) {
      await updateRule.mutateAsync({ id: rule.id, ...cleanData });
    } else {
      await createRule.mutateAsync(cleanData as any);
    }
    onOpenChange(false);
    form.reset();
  };

  const isLoading = createRule.isPending || updateRule.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? 'Editar Regra' : 'Nova Regra de Comissão'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Regra *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Comissão Padrão 10%" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="commission_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Comissão</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(commissionTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Maior = aplica primeiro</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Commission Values */}
            <div className="grid grid-cols-2 gap-4">
              {(commissionType === 'percentual_lucro' || commissionType === 'mista' || commissionType === 'escalonada') && (
                <FormField
                  control={form.control}
                  name="percentage_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentual do Lucro (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(commissionType === 'valor_fixo' || commissionType === 'mista') && (
                <FormField
                  control={form.control}
                  name="fixed_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Fixo (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_vehicle_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Mín. Veículo</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0 = sem limite" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_vehicle_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Máx. Veículo</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0 = sem limite" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Profit Margin */}
            <FormField
              control={form.control}
              name="min_profit_margin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Margem Mínima de Lucro (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="Ex: 10 = só aplica se margem >= 10%" {...field} />
                  </FormControl>
                  <FormDescription>Incentiva vendedores a negociar margens melhores</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Days in Stock */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_days_in_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias Mín. em Estoque</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0 = sem limite" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_days_in_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias Máx. em Estoque</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0 = sem limite" {...field} />
                    </FormControl>
                    <FormDescription>Bonifica venda rápida</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campaign Bonus */}
            <FormField
              control={form.control}
              name="campaign_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campanha Vinculada (Bônus)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma campanha" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {campaigns?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Aplica bônus para vendas de campanha específica</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Goal Settings */}
            {commissionType === 'escalonada' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="goal_period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Período da Meta</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(goalPeriodLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goal_target"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta de Vendas</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} placeholder="Descrição detalhada da regra..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Regra Ativa</FormLabel>
                    <FormDescription>Regras inativas não são aplicadas</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : rule ? 'Atualizar' : 'Criar Regra'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
