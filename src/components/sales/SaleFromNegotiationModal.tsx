import { useState, useEffect } from 'react';
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
import { useCreateSale } from '@/hooks/useSales';
import { useCustomers, useCreateCustomer } from '@/hooks/useCustomers';
import { paymentMethodLabels } from '@/types/sales';
import type { Negotiation } from '@/types/negotiations';
import { AlertCircle, CheckCircle } from 'lucide-react';

const formSchema = z.object({
  customer_id: z.string().min(1, 'Selecione ou crie um cliente'),
  sale_date: z.string().min(1, 'Data obrigatória'),
  sale_price: z.coerce.number().min(1, 'Valor obrigatório'),
  payment_method: z.enum(['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'financiamento', 'consorcio', 'permuta', 'misto']),
  payment_details: z.string().optional(),
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
  const createCustomer = useCreateCustomer();
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: '',
      sale_date: new Date().toISOString().split('T')[0],
      sale_price: 0,
      payment_method: 'pix',
      payment_details: '',
      documentation_cost: 0,
      transfer_cost: 0,
      other_sale_costs: 0,
      notes: '',
    },
  });

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
        payment_method: 'pix',
        payment_details: '',
        documentation_cost: 0,
        transfer_cost: 0,
        other_sale_costs: 0,
        notes: negotiation.notes || '',
      });

      // Auto-create customer from lead if no customer exists
      if (!negotiation.customer_id && negotiation.lead) {
        autoCreateCustomer();
      }
    }
  }, [negotiation?.id, open]);


  const onSubmit = async (data: FormData) => {
    if (!negotiation?.vehicle_id) {
      return;
    }

    // TODAS as vendas vão para aprovação primeiro, independente de quem registre
    // O salesperson_id deve ser o vendedor responsável pela negociação, não quem está registrando
    const salespersonId = negotiation.salesperson_id;

    await createSale.mutateAsync({
      customer_id: data.customer_id,
      vehicle_id: negotiation.vehicle_id,
      lead_id: negotiation.lead_id,
      sale_date: data.sale_date,
      sale_price: data.sale_price,
      payment_method: data.payment_method,
      payment_details: data.payment_details,
      documentation_cost: data.documentation_cost,
      transfer_cost: data.transfer_cost,
      other_sale_costs: data.other_sale_costs,
      status: 'pendente', // Sempre pendente para aprovação
      notes: data.notes,
      salesperson_id: salespersonId, // Vendedor responsável da negociação
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
  const leadData = negotiation?.lead;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); else onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Customer Selection */}
            <div className="space-y-2">
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
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                    <FormLabel>Valor da Venda *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(paymentMethodLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="documentation_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Documentação</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
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
                    <FormLabel>Custo Transferência</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
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
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="payment_details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes do Pagamento</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <Button type="submit" disabled={isLoading || !hasVehicle}>
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
