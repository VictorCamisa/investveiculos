import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAutomotiveKPIs } from '@/hooks/useAutomotiveKPIs';
import { 
  subDays, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, format 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowUpRight, ArrowDownRight, Minus,
  DollarSign, Users, Target, Calendar, CheckCircle, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

interface ComparisonCardProps {
  title: string;
  icon: React.ReactNode;
  currentValue: string | number;
  previousValue: string | number;
  variation: number;
  isInverted?: boolean; // For metrics where lower is better (like CPL)
}

function ComparisonCard({ title, icon, currentValue, previousValue, variation, isInverted = false }: ComparisonCardProps) {
  const isPositive = isInverted ? variation < 0 : variation > 0;
  const isNeutral = Math.abs(variation) < 0.5;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          {icon}
          {title}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Current Period */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Período Atual</p>
            <p className="text-xl font-bold">{currentValue}</p>
          </div>
          
          {/* Previous Period */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Período Anterior</p>
            <p className="text-xl font-medium text-muted-foreground">{previousValue}</p>
          </div>
        </div>

        {/* Variation */}
        <div className={cn(
          'mt-3 flex items-center gap-1 text-sm font-medium',
          isNeutral ? 'text-muted-foreground' : isPositive ? 'text-success' : 'text-destructive'
        )}>
          {isNeutral ? (
            <Minus className="h-4 w-4" />
          ) : isPositive ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          {Math.abs(variation).toFixed(1)}%
          <span className="text-muted-foreground font-normal ml-1">
            {isNeutral ? 'estável' : isPositive ? 'aumento' : 'queda'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

type PresetType = 'weekVsWeek' | 'monthVsMonth' | 'last7vs7' | 'last30vs30';

export function ComparativeDashboard() {
  const [preset, setPreset] = useState<PresetType>('last30vs30');

  const { currentRange, previousRange, currentLabel, previousLabel } = useMemo(() => {
    const today = new Date();
    
    switch (preset) {
      case 'weekVsWeek':
        return {
          currentRange: { from: startOfWeek(today, { locale: ptBR }), to: today },
          previousRange: { 
            from: startOfWeek(subDays(today, 7), { locale: ptBR }), 
            to: endOfWeek(subDays(today, 7), { locale: ptBR }) 
          },
          currentLabel: 'Esta Semana',
          previousLabel: 'Semana Passada',
        };
      case 'monthVsMonth':
        return {
          currentRange: { from: startOfMonth(today), to: today },
          previousRange: { 
            from: startOfMonth(subMonths(today, 1)), 
            to: endOfMonth(subMonths(today, 1)) 
          },
          currentLabel: 'Este Mês',
          previousLabel: 'Mês Passado',
        };
      case 'last7vs7':
        return {
          currentRange: { from: subDays(today, 7), to: today },
          previousRange: { from: subDays(today, 14), to: subDays(today, 7) },
          currentLabel: 'Últimos 7 dias',
          previousLabel: '7 dias anteriores',
        };
      case 'last30vs30':
      default:
        return {
          currentRange: { from: subDays(today, 30), to: today },
          previousRange: { from: subDays(today, 60), to: subDays(today, 30) },
          currentLabel: 'Últimos 30 dias',
          previousLabel: '30 dias anteriores',
        };
    }
  }, [preset]);

  const { data: current, isLoading: currentLoading } = useAutomotiveKPIs(currentRange);
  const { data: previous, isLoading: previousLoading } = useAutomotiveKPIs(previousRange);

  const isLoading = currentLoading || previousLoading;

  const calcVariation = (curr: number, prev: number) =>
    prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Comparativo</h1>
          <p className="text-muted-foreground">
            {currentLabel} vs {previousLabel}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'last7vs7', label: '7d vs 7d' },
            { key: 'last30vs30', label: '30d vs 30d' },
            { key: 'weekVsWeek', label: 'Semana vs Semana' },
            { key: 'monthVsMonth', label: 'Mês vs Mês' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={preset === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreset(key as PresetType)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Period Labels */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Período Atual</p>
                <p className="text-xs text-muted-foreground">
                  {format(currentRange.from, 'dd/MM/yyyy')} - {format(currentRange.to, 'dd/MM/yyyy')}
                </p>
              </div>
              <Badge>Atual</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Período Anterior</p>
                <p className="text-xs text-muted-foreground">
                  {format(previousRange.from, 'dd/MM/yyyy')} - {format(previousRange.to, 'dd/MM/yyyy')}
                </p>
              </div>
              <Badge variant="secondary">Anterior</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Cards */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-32" /></CardContent></Card>
          ))}
        </div>
      ) : current && previous && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ComparisonCard
            title="Investimento"
            icon={<DollarSign className="h-4 w-4" />}
            currentValue={formatCurrency(current.investment)}
            previousValue={formatCurrency(previous.investment)}
            variation={calcVariation(current.investment, previous.investment)}
          />
          <ComparisonCard
            title="Leads"
            icon={<Users className="h-4 w-4" />}
            currentValue={current.leads}
            previousValue={previous.leads}
            variation={calcVariation(current.leads, previous.leads)}
          />
          <ComparisonCard
            title="CPL"
            icon={<Target className="h-4 w-4" />}
            currentValue={formatCurrency(current.cpl)}
            previousValue={formatCurrency(previous.cpl)}
            variation={calcVariation(current.cpl, previous.cpl)}
            isInverted
          />
          <ComparisonCard
            title="Agendamentos"
            icon={<Calendar className="h-4 w-4" />}
            currentValue={current.appointments}
            previousValue={previous.appointments}
            variation={calcVariation(current.appointments, previous.appointments)}
          />
          <ComparisonCard
            title="Vendas"
            icon={<CheckCircle className="h-4 w-4" />}
            currentValue={current.sales}
            previousValue={previous.sales}
            variation={calcVariation(current.sales, previous.sales)}
          />
          <ComparisonCard
            title="ROAS"
            icon={<TrendingUp className="h-4 w-4" />}
            currentValue={`${current.roas.toFixed(1)}x`}
            previousValue={`${previous.roas.toFixed(1)}x`}
            variation={calcVariation(current.roas, previous.roas)}
          />
        </div>
      )}

      {/* Additional Automotive KPIs */}
      {!isLoading && current && previous && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">KPIs Automotivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Custo por Agendamento</p>
                <p className="text-lg font-bold">{formatCurrency(current.costPerAppointment)}</p>
                <p className="text-xs text-muted-foreground">
                  Anterior: {formatCurrency(previous.costPerAppointment)}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Custo por Venda (CPA)</p>
                <p className="text-lg font-bold">{formatCurrency(current.costPerSale)}</p>
                <p className="text-xs text-muted-foreground">
                  Anterior: {formatCurrency(previous.costPerSale)}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Taxa de No-Show</p>
                <p className="text-lg font-bold">{formatPercent(current.noShowRate)}</p>
                <p className="text-xs text-muted-foreground">
                  Anterior: {formatPercent(previous.noShowRate)}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Dias até Conversão</p>
                <p className="text-lg font-bold">{current.avgConversionDays.toFixed(0)} dias</p>
                <p className="text-xs text-muted-foreground">
                  Anterior: {previous.avgConversionDays.toFixed(0)} dias
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
