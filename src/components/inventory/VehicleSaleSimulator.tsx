import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface VehicleSaleSimulatorProps {
  totalCost: number;
  suggestedPrice?: number | null;
  minimumPrice?: number | null;
}

export function VehicleSaleSimulator({ totalCost, suggestedPrice, minimumPrice }: VehicleSaleSimulatorProps) {
  const [simulatedPrice, setSimulatedPrice] = useState<number>(suggestedPrice || totalCost * 1.15);

  useEffect(() => {
    if (suggestedPrice) {
      setSimulatedPrice(suggestedPrice);
    }
  }, [suggestedPrice]);

  const grossMargin = simulatedPrice - totalCost;
  const marginPercent = totalCost > 0 ? (grossMargin / totalCost) * 100 : 0;
  const isProfit = grossMargin >= 0;
  const isBelowMinimum = minimumPrice && simulatedPrice < minimumPrice;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Range do slider: de 80% do custo até 150% do custo
  const minSliderValue = totalCost * 0.8;
  const maxSliderValue = totalCost * 1.5;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-5 w-5 text-primary" />
          Simulador de Venda
        </CardTitle>
        <CardDescription>Calcule a margem baseado no preço de venda</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input de preço */}
        <div className="space-y-2">
          <Label htmlFor="simulated_price">Preço de Venda Simulado</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
            <Input
              id="simulated_price"
              type="number"
              value={simulatedPrice}
              onChange={(e) => setSimulatedPrice(Number(e.target.value))}
              className="pl-10 text-lg font-semibold"
            />
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <Slider
            value={[simulatedPrice]}
            onValueChange={(values) => setSimulatedPrice(values[0])}
            min={minSliderValue}
            max={maxSliderValue}
            step={500}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(minSliderValue)}</span>
            <span>{formatCurrency(maxSliderValue)}</span>
          </div>
        </div>

        {/* Resultado */}
        <div className={`rounded-lg p-4 space-y-3 ${isProfit ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isProfit ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">Margem Bruta</span>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(grossMargin)}
              </p>
              <p className="text-sm text-muted-foreground">
                {marginPercent.toFixed(1)}% sobre o custo
              </p>
            </div>
          </div>

          {/* Detalhes */}
          <div className="pt-2 border-t border-current/10 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço de Venda</span>
              <span className="font-medium">{formatCurrency(simulatedPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">(-) Custo Total</span>
              <span className="font-medium">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {isBelowMinimum && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
            <DollarSign className="h-4 w-4" />
            <span>
              Atenção: Abaixo do preço mínimo ({formatCurrency(minimumPrice!)})
            </span>
          </div>
        )}

        {/* Referências */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {suggestedPrice && (
            <div className="p-2 bg-muted/50 rounded text-center">
              <p className="text-xs text-muted-foreground">Preço Sugerido</p>
              <p className="font-medium">{formatCurrency(suggestedPrice)}</p>
            </div>
          )}
          {minimumPrice && (
            <div className="p-2 bg-muted/50 rounded text-center">
              <p className="text-xs text-muted-foreground">Preço Mínimo</p>
              <p className="font-medium">{formatCurrency(minimumPrice)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
