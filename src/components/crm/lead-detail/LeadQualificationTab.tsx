import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ClipboardList, Car, Wallet, CreditCard, Timer, 
  Repeat, FileText, TrendingUp, Calendar, Flame,
  Thermometer, Snowflake, DollarSign, Target, UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getScoreClassification, getClassificationLabel } from '@/hooks/useLeadQualification';
import { PAYMENT_METHODS, PURCHASE_TIMELINES, VEHICLE_USAGE } from '@/types/qualification';
import { LeadScoreIndicator } from '../LeadScoreIndicator';

interface Qualification {
  id: string;
  score: number;
  completeness_score: number | null;
  engagement_score: number | null;
  vehicle_interest: string | null;
  budget_min: number | null;
  budget_max: number | null;
  down_payment: number | null;
  max_installment: number | null;
  payment_method: string | null;
  purchase_timeline: string | null;
  vehicle_usage: string | null;
  has_trade_in: boolean | null;
  trade_in_vehicle: string | null;
  trade_in_value: number | null;
  notes: string | null;
  created_at: string;
  negotiation_id: string | null;
}

interface LeadQualificationTabProps {
  qualifications: Qualification[];
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
}

function ScoreIcon({ classification }: { classification: 'hot' | 'warm' | 'cold' }) {
  switch (classification) {
    case 'hot':
      return <Flame className="h-5 w-5 text-green-500" />;
    case 'warm':
      return <Thermometer className="h-5 w-5 text-yellow-500" />;
    case 'cold':
      return <Snowflake className="h-5 w-5 text-blue-500" />;
  }
}

function QualificationCard({ qual, index }: { qual: Qualification; index: number }) {
  const score = qual.score || 0;
  const classification = getScoreClassification(score);
  const classLabel = getClassificationLabel(classification);
  
  const paymentLabel = PAYMENT_METHODS.find(p => p.value === qual.payment_method)?.label;
  const timelineLabel = PURCHASE_TIMELINES.find(t => t.value === qual.purchase_timeline)?.label;
  const usageLabel = VEHICLE_USAGE.find(u => u.value === qual.vehicle_usage)?.label;

  const dataScore = qual.completeness_score || 0;
  const engagementScore = qual.engagement_score || 0;

  return (
    <Card className="overflow-hidden">
      {/* Header with Score Summary */}
      <div className={`p-4 border-b ${
        classification === 'hot' ? 'bg-green-500/10' :
        classification === 'warm' ? 'bg-yellow-500/10' : 'bg-blue-500/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
              classification === 'hot' ? 'bg-green-500/20' :
              classification === 'warm' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
            }`}>
              <ScoreIcon classification={classification} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{score}</span>
                <span className="text-sm text-muted-foreground">/100 pts</span>
              </div>
              <Badge className={`text-xs ${
                classification === 'hot' ? 'bg-green-500' :
                classification === 'warm' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}>
                {classLabel}
              </Badge>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Qualificação #{index + 1}</p>
            <p>{format(new Date(qual.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-background/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Dados</span>
              <span className="text-xs font-medium">{dataScore}/50</span>
            </div>
            <Progress value={(dataScore / 50) * 100} className="h-2" />
          </div>
          <div className="bg-background/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Engajamento</span>
              <span className="text-xs font-medium">{engagementScore}/50</span>
            </div>
            <Progress value={(engagementScore / 50) * 100} className="h-2" />
          </div>
        </div>
      </div>

      {/* Qualification Details */}
      <CardContent className="p-4 space-y-4">
        {/* Vehicle Interest */}
        {qual.vehicle_interest && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <Car className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Veículo de Interesse</p>
              <p className="text-sm font-semibold">{qual.vehicle_interest}</p>
            </div>
          </div>
        )}

        {/* Financial Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Budget */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-card">
            <Wallet className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Orçamento</p>
              {(qual.budget_min || qual.budget_max) ? (
                <p className="text-sm font-semibold truncate">
                  {qual.budget_min && qual.budget_max 
                    ? `${formatCurrency(qual.budget_min)} - ${formatCurrency(qual.budget_max)}`
                    : qual.budget_min 
                      ? `A partir de ${formatCurrency(qual.budget_min)}`
                      : `Até ${formatCurrency(qual.budget_max)}`}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Não informado</p>
              )}
            </div>
          </div>

          {/* Down Payment */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-card">
            <DollarSign className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entrada</p>
              <p className="text-sm font-semibold">
                {qual.down_payment ? formatCurrency(qual.down_payment) : 'Não informado'}
              </p>
            </div>
          </div>

          {/* Max Installment */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-card">
            <CreditCard className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Parcela Máx.</p>
              <p className="text-sm font-semibold">
                {qual.max_installment ? formatCurrency(qual.max_installment) : 'Não informado'}
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-card">
            <Target className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pagamento</p>
              <p className="text-sm font-semibold">
                {paymentLabel || 'Não informado'}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Timeline & Usage */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30">
            <Timer className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Prazo</p>
              <p className="text-sm font-medium">{timelineLabel || 'Não informado'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30">
            <UserCheck className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Uso</p>
              <p className="text-sm font-medium">{usageLabel || 'Não informado'}</p>
            </div>
          </div>
        </div>

        {/* Trade-in */}
        {qual.has_trade_in && (
          <div className="p-3 rounded-lg border border-dashed bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Repeat className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Veículo para Troca
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{qual.trade_in_vehicle || 'Não especificado'}</p>
              {qual.trade_in_value && (
                <Badge variant="secondary">
                  {formatCurrency(qual.trade_in_value)}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {qual.notes && (
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Observações
              </span>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{qual.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LeadQualificationTab({ qualifications }: LeadQualificationTabProps) {
  if (qualifications.length === 0) {
    return (
      <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
        <div className="h-full flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Nenhuma qualificação registrada</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            As qualificações são criadas durante o processo de negociação para avaliar o potencial do lead.
          </p>
        </div>
      </ScrollArea>
    );
  }

  // Sort by date, most recent first
  const sortedQualifications = [...qualifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {qualifications.filter(q => getScoreClassification(q.score) === 'hot').length}
              </p>
              <p className="text-xs text-muted-foreground">Quentes</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {qualifications.filter(q => getScoreClassification(q.score) === 'warm').length}
              </p>
              <p className="text-xs text-muted-foreground">Mornos</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {qualifications.filter(q => getScoreClassification(q.score) === 'cold').length}
              </p>
              <p className="text-xs text-muted-foreground">Frios</p>
            </CardContent>
          </Card>
        </div>

        {/* Qualifications List */}
        {sortedQualifications.map((qual, index) => (
          <QualificationCard 
            key={qual.id} 
            qual={qual} 
            index={sortedQualifications.length - index} 
          />
        ))}
      </div>
    </ScrollArea>
  );
}
