import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useCreateSale } from '@/hooks/useSales';
import { useCustomers, useCreateCustomer } from '@/hooks/useCustomers';
import { useVehicles } from '@/hooks/useVehicles';
import type { Negotiation } from '@/types/negotiations';
import { PaymentMethodsSection, PaymentMethodEntry } from './PaymentMethodsSection';
import { CommissionSection } from './CommissionSection';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const formSchema = z.object({
  customer_id: z.string().min(1, 'Selecione ou crie um cliente'),
  sale_date: z.string().min(1, 'Data obrigatória'),
  sale_price: z.coerce.number().min(1, 'Valor obrigatório'),
  documentation_cost: z.coerce.number().optional(),
  transfer_cost: z.coerce.number().optional(),
  other_sale_costs: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SaleFromNegotiationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiation: Negotiation | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SaleFromNegotiationModal({ 
  open, 
  onOpenChange, 
  negotiation,
  onSuccess,
  onCancel
}: SaleFromNegotiationModalProps) {
  const createSale = useCreateSale();
  const { data: customers } = useCustomers();
  const { data: vehicles } = useVehicles();
  const createCustomer = useCreateCustomer();
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Fetch salespeople (users with vendedor role)
  const { data: salespeople } = useQuery({
    queryKey: ['salespeople-for-sale'],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'vendedor');
      
      if (!roles?.length) return [];
      
      const userIds = (roles as { user_id: string }[]).map(r => r.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
        .eq('is_active', true);
      
      return profiles || [];
    },
  });

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodEntry[]>([
    { id: crypto.randomUUID(), payment_method: 'pix', amount: 0 }
  ]);

  // Commission state
  const [salespersonId, setSalespersonId] = useState('');
  const [commissionRuleId, setCommissionRuleId] = useState<string | null>(null);
  const [manualAdjustment, setManualAdjustment] = useState(0);
  const [calculatedCommission, setCalculatedCommission] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: '',
      sale_date: new Date().toISOString().split('T')[0],
      sale_price: 0,
      documentation_cost: 0,
      transfer_cost: 0,
      other_sale_costs: 0,
      notes: '',
    },
  });

  const salePrice = form.watch('sale_price');

  // Get selected vehicle purchase price for profit calculation
  const selectedVehicle = vehicles?.find(v => v.id === negotiation?.vehicle_id);
  const purchasePrice = selectedVehicle?.purchase_price || 0;

  const paymentsTotal = paymentMethods.reduce((sum, p) => sum + (p.amount || 0), 0);
  const isPaymentBalanced = Math.abs(paymentsTotal - salePrice) < 0.01;

  const handleCalculatedCommissionChange = useCallback((value: number) => {
    setCalculatedCommission(value);
  }, []);

  // Auto-create customer from lead
  const autoCreateCustomer = async () => {
    if (!negotiation?.lead) return;
    
    setCreatingCustomer(true);
    try {
      const result = await createCustomer.mutateAsync({
        name: negotiation.lead.name,
        phone: negotiation.lead.phone,
        email: negotiation.lead.email || undefined,
        lead_id: negotiation.lead_id,
      });
      form.setValue('customer_id', result.id);
    } catch (error) {
      console.error('Error auto-creating customer:', error);
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Set default values and auto-create customer from lead
  useEffect(() => {
    if (negotiation && open) {
      form.reset({
        customer_id: negotiation.customer_id || '',
        sale_date: new Date().toISOString().split('T')[0],
        sale_price: negotiation.estimated_value || 0,
        documentation_cost: 0,
        transfer_cost: 0,
        other_sale_costs: 0,
        notes: negotiation.notes || '',
      });

      // Set salesperson from negotiation
      setSalespersonId(negotiation.salesperson_id || '');

      // Reset payment methods with the sale price
      setPaymentMethods([
        { id: crypto.randomUUID(), payment_method: 'pix', amount: negotiation.estimated_value || 0 }
      ]);

      // Auto-create customer from lead if no customer exists
      if (!negotiation.customer_id && negotiation.lead) {
        autoCreateCustomer();
      }
    }
  }, [negotiation?.id, open]);


  const onSubmit = async (data: FormData) => {
    if (!negotiation?.vehicle_id || !isPaymentBalanced) {
      return;
    }

    const paymentMethod = paymentMethods.length === 1 
      ? paymentMethods[0].payment_method as 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'financiamento' | 'consorcio' | 'permuta' | 'misto'
      : 'misto' as const;

    await createSale.mutateAsync({
      customer_id: data.customer_id,
      vehicle_id: negotiation.vehicle_id,
      lead_id: negotiation.lead_id,
      sale_date: data.sale_date,
      sale_price: data.sale_price,
      payment_method: paymentMethod,
      payment_details: paymentMethods.length > 1 
        ? `Múltiplos pagamentos: ${paymentMethods.map(p => `${p.payment_method}: R$ ${p.amount}`).join(', ')}`
        : paymentMethods[0]?.details || '',
      documentation_cost: data.documentation_cost,
      transfer_cost: data.transfer_cost,
      other_sale_costs: data.other_sale_costs,
      status: 'pendente',
      notes: data.notes,
      salesperson_id: salespersonId || negotiation.salesperson_id,
    });

    onOpenChange(false);
    form.reset();
    onSuccess?.();
  };

  const handleCancel = () => {
    onOpenChange(false);
    form.reset();
    onCancel?.();
  };

  const isLoading = createSale.isPending || creatingCustomer;

  // Check if we have everything needed
  const hasVehicle = !!negotiation?.vehicle_id;
  const hasCustomer = !!form.watch('customer_id');

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); else onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Venda</DialogTitle>
          <DialogDescription>
            Preencha os dados para registrar a venda. Ela será enviada para aprovação.
          </DialogDescription>
        </DialogHeader>

        {/* Info Alert - Sempre mostra, todas vendas precisam de aprovação */}
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-500">
            Todas as vendas são enviadas para aprovação antes de serem concluídas.
          </AlertDescription>
        </Alert>

        {/* Vehicle Info */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <p className="text-sm font-medium">Veículo</p>
          {negotiation?.vehicle ? (
            <p className="text-sm text-muted-foreground">
              {negotiation.vehicle.brand} {negotiation.vehicle.model} {negotiation.vehicle.year_model}
              {negotiation.vehicle.plate && ` - ${negotiation.vehicle.plate}`}
            </p>
          ) : (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum veículo selecionado na negociação. Selecione um veículo antes de registrar a venda.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Selection */}
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  {creatingCustomer ? (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground">Criando cliente a partir do lead...</span>
                    </div>
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {hasCustomer && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Cliente vinculado automaticamente do lead
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sale_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Venda *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sale_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total da Venda *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Payment Methods Section */}
            <PaymentMethodsSection
              paymentMethods={paymentMethods}
              onChange={setPaymentMethods}
              totalSalePrice={salePrice}
            />

            {!isPaymentBalanced && salePrice > 0 && (
              <p className="text-sm text-destructive">
                A soma dos pagamentos (R$ {paymentsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) 
                deve ser igual ao valor total da venda (R$ {salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
              </p>
            )}

            <Separator />

            {/* Commission Section */}
            <CommissionSection
              salespersonId={salespersonId}
              onSalespersonChange={setSalespersonId}
              salePrice={salePrice}
              purchasePrice={purchasePrice}
              commissionRuleId={commissionRuleId}
              onCommissionRuleChange={setCommissionRuleId}
              manualAdjustment={manualAdjustment}
              onManualAdjustmentChange={setManualAdjustment}
              calculatedCommission={calculatedCommission}
              onCalculatedCommissionChange={handleCalculatedCommissionChange}
              salespeople={salespeople || []}
            />

            <Separator />

            {/* Additional Costs */}
            <div>
              <h3 className="font-medium mb-3">Custos Adicionais</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="documentation_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documentação</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="R$ 0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transfer_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transferência</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="R$ 0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="other_sale_costs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outros Custos</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="R$ 0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !hasVehicle || (!isPaymentBalanced && salePrice > 0)}>
                {isLoading ? 'Salvando...' : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enviar para Aprovação
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
