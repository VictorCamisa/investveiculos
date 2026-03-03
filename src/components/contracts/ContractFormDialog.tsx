import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContracts, ContractFormData } from '@/hooks/useContracts';
import { useCustomers } from '@/hooks/useCustomers';
import { useVehicles } from '@/hooks/useVehicles';
import { FileText, User, Car, CreditCard, HandCoins } from 'lucide-react';

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<ContractFormData>;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function ContractFormDialog({ open, onOpenChange, initialData }: ContractFormDialogProps) {
  const { createContract } = useContracts();
  const { data: customers = [] } = useCustomers();
  const { data: vehicles = [] } = useVehicles();

  const [formData, setFormData] = useState<ContractFormData>({
    contract_type: 'venda', customer_name: '', vehicle_brand: '', vehicle_model: '', vehicle_year: '', vehicle_value: 0,
  });
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [hasInstallments, setHasInstallments] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      if (initialData.trade_in_brand) setHasTradeIn(true);
      if (initialData.installments_count && initialData.installments_count > 0) setHasInstallments(true);
    } else if (!open) {
      setFormData({ contract_type: 'venda', customer_name: '', vehicle_brand: '', vehicle_model: '', vehicle_year: '', vehicle_value: 0 });
      setHasTradeIn(false);
      setHasInstallments(false);
    }
  }, [open, initialData]);

  const availableVehicles = vehicles.filter(v => v.status === 'disponivel' || v.id === initialData?.vehicle_id);

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev, customer_id: customerId, customer_name: customer.name,
        customer_cpf: customer.cpf_cnpj || '', customer_phone: customer.phone || '',
        customer_email: customer.email || '', customer_address: customer.address || '',
        customer_city: customer.city || '', customer_state: customer.state || '',
      }));
    }
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setFormData(prev => ({
        ...prev, vehicle_id: vehicleId, vehicle_brand: vehicle.brand, vehicle_model: vehicle.model,
        vehicle_year: `${vehicle.year_fabrication}/${vehicle.year_model}`,
        vehicle_plate: vehicle.plate || '', vehicle_color: vehicle.color || '',
        vehicle_renavam: vehicle.renavam || '', vehicle_odometer: vehicle.km || 0,
        vehicle_value: vehicle.sale_price || 0,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.customer_name || !formData.vehicle_brand) return;
    await createContract.mutateAsync({ ...formData, updateRelated: true });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Novo Contrato
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Tipo de Contrato</Label>
              <Select value={formData.contract_type} onValueChange={(v: 'venda' | 'compra') => setFormData(p => ({ ...p, contract_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="venda">Contrato de Venda</SelectItem>
                  <SelectItem value="compra">Contrato de Compra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Dados do Cliente</h3>
              <div className="space-y-2">
                <Label>Selecionar Cliente</Label>
                <Select onValueChange={handleCustomerSelect} value={formData.customer_id}>
                  <SelectTrigger><SelectValue placeholder="Buscar cliente..." /></SelectTrigger>
                  <SelectContent>
                    {customers.slice(0, 50).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} {c.cpf_cnpj ? `- ${c.cpf_cnpj}` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={formData.customer_name} onChange={e => setFormData(p => ({ ...p, customer_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input value={formData.customer_cpf || ''} onChange={e => setFormData(p => ({ ...p, customer_cpf: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={formData.customer_phone || ''} onChange={e => setFormData(p => ({ ...p, customer_phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={formData.customer_email || ''} onChange={e => setFormData(p => ({ ...p, customer_email: e.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input value={formData.customer_address || ''} onChange={e => setFormData(p => ({ ...p, customer_address: e.target.value }))} />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Car className="h-4 w-4" /> Veículo</h3>
              <div className="space-y-2">
                <Label>Selecionar Veículo</Label>
                <Select onValueChange={handleVehicleSelect} value={formData.vehicle_id}>
                  <SelectTrigger><SelectValue placeholder="Selecionar veículo..." /></SelectTrigger>
                  <SelectContent>
                    {availableVehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} {v.year_model} - {v.plate}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Marca *</Label><Input value={formData.vehicle_brand} onChange={e => setFormData(p => ({ ...p, vehicle_brand: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Modelo *</Label><Input value={formData.vehicle_model} onChange={e => setFormData(p => ({ ...p, vehicle_model: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Ano</Label><Input value={formData.vehicle_year} onChange={e => setFormData(p => ({ ...p, vehicle_year: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Placa</Label><Input value={formData.vehicle_plate || ''} onChange={e => setFormData(p => ({ ...p, vehicle_plate: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Cor</Label><Input value={formData.vehicle_color || ''} onChange={e => setFormData(p => ({ ...p, vehicle_color: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" value={formData.vehicle_value} onChange={e => setFormData(p => ({ ...p, vehicle_value: parseFloat(e.target.value) || 0 }))} /></div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4" /> Pagamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Entrada (R$)</Label><Input type="number" value={formData.down_payment || ''} onChange={e => setFormData(p => ({ ...p, down_payment: parseFloat(e.target.value) || 0 }))} /></div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={hasTradeIn} onChange={e => setHasTradeIn(e.target.checked)} id="tradeIn" />
                <Label htmlFor="tradeIn">Veículo de troca</Label>
              </div>
              {hasTradeIn && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4 border-l-2 border-primary/20">
                  <div className="space-y-2"><Label>Marca</Label><Input value={formData.trade_in_brand || ''} onChange={e => setFormData(p => ({ ...p, trade_in_brand: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Modelo</Label><Input value={formData.trade_in_model || ''} onChange={e => setFormData(p => ({ ...p, trade_in_model: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" value={formData.trade_in_value || ''} onChange={e => setFormData(p => ({ ...p, trade_in_value: parseFloat(e.target.value) || 0 }))} /></div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={hasInstallments} onChange={e => setHasInstallments(e.target.checked)} id="installments" />
                <Label htmlFor="installments">Parcelamento</Label>
              </div>
              {hasInstallments && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4 border-l-2 border-primary/20">
                  <div className="space-y-2"><Label>Parcelas</Label><Input type="number" value={formData.installments_count || ''} onChange={e => setFormData(p => ({ ...p, installments_count: parseInt(e.target.value) || 0 }))} /></div>
                  <div className="space-y-2"><Label>Valor da Parcela</Label><Input type="number" value={formData.installment_value || ''} onChange={e => setFormData(p => ({ ...p, installment_value: parseFloat(e.target.value) || 0 }))} /></div>
                  <div className="space-y-2"><Label>Dia Venc.</Label><Input type="number" value={formData.installment_due_day || ''} onChange={e => setFormData(p => ({ ...p, installment_due_day: parseInt(e.target.value) || 0 }))} /></div>
                </div>
              )}
            </div>

            <Separator />
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={formData.notes || ''} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={3} />
            </div>

            <Button onClick={handleSubmit} disabled={createContract.isPending} className="w-full">
              {createContract.isPending ? 'Criando...' : 'Criar Contrato'}
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
