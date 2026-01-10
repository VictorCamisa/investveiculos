import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCreateCommissionRule, useUpdateCommissionRule } from '@/hooks/useCommissions';
import { commissionTypeLabels, type CommissionRule } from '@/types/sales';

const formSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  commission_type: z.enum(['percentual_lucro', 'valor_fixo', 'escalonada', 'mista']),
  percentage_value: z.coerce.number().optional(),
  fixed_value: z.coerce.number().optional(),
  min_vehicle_price: z.coerce.number().optional(),
  max_vehicle_price: z.coerce.number().optional(),
  min_profit_margin: z.coerce.number().optional(),
  is_active: z.boolean(),
  priority: z.coerce.number(),
});

type FormData = z.infer<typeof formSchema>;

interface CommissionRuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: CommissionRule | null;
}

export function CommissionRuleForm({ open, onOpenChange, rule }: CommissionRuleFormProps) {
  const createRule = useCreateCommissionRule();
  const updateRule = useUpdateCommissionRule();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: rule?.name || '',
      description: rule?.description || '',
      commission_type: rule?.commission_type || 'percentual_lucro',
      percentage_value: rule?.percentage_value || rule?.percentage || 0,
      fixed_value: rule?.fixed_value || 0,
      min_vehicle_price: rule?.min_vehicle_price || 0,
      max_vehicle_price: rule?.max_vehicle_price || 0,
      min_profit_margin: rule?.min_profit_margin || 0,
      is_active: rule?.is_active ?? true,
      priority: rule?.priority || 0,
    },
  });

  const commissionType = form.watch('commission_type');

  const onSubmit = async (data: FormData) => {
    if (rule) {
      await updateRule.mutateAsync({ id: rule.id, ...data });
    } else {
      await createRule.mutateAsync(data as any);
    }
    onOpenChange(false);
    form.reset();
  };

  const isLoading = createRule.isPending || updateRule.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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

            <FormField
              control={form.control}
              name="commission_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Comissão</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            {(commissionType === 'percentual_lucro' || commissionType === 'mista') && (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_vehicle_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Mín. Veículo</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
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
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="min_profit_margin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Margem Mín. de Lucro (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} />
                  </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
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
