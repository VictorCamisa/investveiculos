import { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCalculateCommission, useCommissionRules } from '@/hooks/useCommissionsComplete';
import { commissionTypeLabels } from '@/types/commissions';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function CommissionSimulatorPage() {
  const [salePrice, setSalePrice] = useState(50000);
  const [purchasePrice, setPurchasePrice] = useState(40000);
  const [daysInStock, setDaysInStock] = useState(30);
  const [result, setResult] = useState<{ rule: any; amount: number } | null>(null);

  const { calculateCommission, rules } = useCalculateCommission();
  const { data: allRules } = useCommissionRules();

  const profit = salePrice - purchasePrice;
  const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

  const simulate = () => {
    const calc = calculateCommission(salePrice, profit, daysInStock);
    setResult(calc);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Simulador de Comissões
        </h2>
        <p className="text-sm text-muted-foreground">Teste novas regras e calcule comissões hipotéticas</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Simulator Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados da Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Preço de Venda</Label>
              <Input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Preço de Compra</Label>
              <Input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Dias em Estoque</Label>
              <Input
                type="number"
                value={daysInStock}
                onChange={(e) => setDaysInStock(Number(e.target.value))}
              />
            </div>

            {/* Calculated Values */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Bruto</p>
                <p className={`text-xl font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(profit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Margem</p>
                <p className={`text-xl font-bold ${margin >= 10 ? 'text-green-500' : 'text-yellow-500'}`}>
                  {margin.toFixed(1)}%
                </p>
              </div>
            </div>

            <Button onClick={simulate} className="w-full">
              <Zap className="h-4 w-4 mr-2" /> Simular Comissão
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resultado da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-2">Comissão Calculada</p>
                  <p className="text-4xl font-bold text-green-500">{formatCurrency(result.amount)}</p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Regra Aplicada</span>
                    <span className="font-medium">{result.rule.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tipo</span>
                    <Badge variant="outline">{commissionTypeLabels[result.rule.commission_type]}</Badge>
                  </div>
                  {result.rule.percentage_value && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Percentual</span>
                      <span>{result.rule.percentage_value}%</span>
                    </div>
                  )}
                  {result.rule.fixed_value && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Valor Fixo</span>
                      <span>{formatCurrency(result.rule.fixed_value)}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Esta é uma simulação baseada nas regras ativas. O valor final pode variar.
                </p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Preencha os dados e clique em simular</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rules Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regras Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rules?.map((rule) => (
              <div key={rule.id} className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{rule.name}</p>
                  <Badge variant="outline" className="text-xs">
                    P{rule.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {commissionTypeLabels[rule.commission_type]}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {rule.percentage_value ? (
                    <Badge className="text-xs bg-primary/20 text-primary">
                      {rule.percentage_value}%
                    </Badge>
                  ) : null}
                  {rule.fixed_value ? (
                    <Badge className="text-xs bg-green-500/20 text-green-400">
                      {formatCurrency(rule.fixed_value)}
                    </Badge>
                  ) : null}
                </div>
              </div>
            ))}
            {(!rules || rules.length === 0) && (
              <p className="col-span-full text-center text-muted-foreground py-4">
                Nenhuma regra ativa
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
