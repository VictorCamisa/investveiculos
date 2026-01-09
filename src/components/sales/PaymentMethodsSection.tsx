import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { paymentMethodLabels } from '@/types/sales';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface PaymentMethodEntry {
  id: string;
  payment_method: string;
  amount: number;
  details?: string;
  financing_bank?: string;
  financing_entry_value?: number;
  financing_financed_value?: number;
  financing_installments?: number;
  financing_installment_value?: number;
  financing_interest_rate?: number;
}

const BANKS = [
  'Santander',
  'Bradesco',
  'Itaú',
  'Banco do Brasil',
  'Caixa Econômica',
  'BV Financeira',
  'Pan',
  'Safra',
  'Daycoval',
  'Votorantim',
  'Omni',
  'Outro',
];

interface PaymentMethodsSectionProps {
  paymentMethods: PaymentMethodEntry[];
  onChange: (methods: PaymentMethodEntry[]) => void;
  totalSalePrice: number;
}

export function PaymentMethodsSection({ 
  paymentMethods, 
  onChange, 
  totalSalePrice 
}: PaymentMethodsSectionProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const totalPaid = paymentMethods.reduce((sum, pm) => sum + (pm.amount || 0), 0);
  const remaining = totalSalePrice - totalPaid;
  const isBalanced = Math.abs(remaining) < 0.01;

  const addPaymentMethod = () => {
    const newMethod: PaymentMethodEntry = {
      id: crypto.randomUUID(),
      payment_method: 'pix',
      amount: remaining > 0 ? remaining : 0,
    };
    onChange([...paymentMethods, newMethod]);
  };

  const removePaymentMethod = (id: string) => {
    onChange(paymentMethods.filter(pm => pm.id !== id));
  };

  const updatePaymentMethod = (id: string, updates: Partial<PaymentMethodEntry>) => {
    onChange(paymentMethods.map(pm => 
      pm.id === id ? { ...pm, ...updates } : pm
    ));
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Calculate financing installment value automatically
  const calculateInstallmentValue = (entry: PaymentMethodEntry) => {
    if (entry.financing_financed_value && entry.financing_installments && entry.financing_installments > 0) {
      const rate = (entry.financing_interest_rate || 0) / 100;
      if (rate > 0) {
        // Tabela Price
        const installment = entry.financing_financed_value * 
          (rate * Math.pow(1 + rate, entry.financing_installments)) / 
          (Math.pow(1 + rate, entry.financing_installments) - 1);
        return installment;
      }
      return entry.financing_financed_value / entry.financing_installments;
    }
    return 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Formas de Pagamento</Label>
        <Button type="button" variant="outline" size="sm" onClick={addPaymentMethod}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {paymentMethods.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>Nenhuma forma de pagamento adicionada.</p>
            <Button type="button" variant="link" onClick={addPaymentMethod}>
              Adicionar forma de pagamento
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {paymentMethods.map((entry) => {
          const isFinancing = entry.payment_method === 'financiamento';
          const isExpanded = expandedItems[entry.id];
          const installmentValue = isFinancing ? calculateInstallmentValue(entry) : 0;

          return (
            <Card key={entry.id} className="relative">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Select 
                    value={entry.payment_method} 
                    onValueChange={(value) => updatePaymentMethod(entry.id, { payment_method: value })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(paymentMethodLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex-1">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Valor"
                      value={entry.amount || ''}
                      onChange={(e) => updatePaymentMethod(entry.id, { amount: parseFloat(e.target.value) || 0 })}
                      className="text-right font-medium"
                    />
                  </div>

                  {isFinancing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(entry.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removePaymentMethod(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Financing Details */}
                {isFinancing && isExpanded && (
                  <div className="border-t pt-4 space-y-4 bg-muted/30 -mx-4 px-4 -mb-4 pb-4 rounded-b-lg">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      Detalhes do Financiamento
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Banco</Label>
                        <Select 
                          value={entry.financing_bank || ''} 
                          onValueChange={(value) => updatePaymentMethod(entry.id, { financing_bank: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o banco" />
                          </SelectTrigger>
                          <SelectContent>
                            {BANKS.map((bank) => (
                              <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Valor de Entrada</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="R$ 0,00"
                          value={entry.financing_entry_value || ''}
                          onChange={(e) => {
                            const entryValue = parseFloat(e.target.value) || 0;
                            const financedValue = entry.amount - entryValue;
                            updatePaymentMethod(entry.id, { 
                              financing_entry_value: entryValue,
                              financing_financed_value: financedValue > 0 ? financedValue : 0
                            });
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Valor Financiado</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="R$ 0,00"
                          value={entry.financing_financed_value || ''}
                          onChange={(e) => updatePaymentMethod(entry.id, { financing_financed_value: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Nº de Parcelas</Label>
                        <Input
                          type="number"
                          placeholder="48"
                          value={entry.financing_installments || ''}
                          onChange={(e) => updatePaymentMethod(entry.id, { financing_installments: parseInt(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Taxa de Juros (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1.99"
                          value={entry.financing_interest_rate || ''}
                          onChange={(e) => updatePaymentMethod(entry.id, { financing_interest_rate: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Valor da Parcela</Label>
                        <div className="p-2 bg-muted rounded-md text-center font-semibold">
                          {formatCurrency(installmentValue)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Total Summary */}
      {paymentMethods.length > 0 && (
        <div className={`flex items-center justify-between p-3 rounded-lg ${
          isBalanced ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Total dos Pagamentos:</span>
            <span className="font-bold">{formatCurrency(totalPaid)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">/ {formatCurrency(totalSalePrice)}</span>
            {isBalanced ? (
              <Badge className="bg-green-500">✓ Conferido</Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-500">
                {remaining > 0 ? `Falta: ${formatCurrency(remaining)}` : `Excesso: ${formatCurrency(Math.abs(remaining))}`}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
