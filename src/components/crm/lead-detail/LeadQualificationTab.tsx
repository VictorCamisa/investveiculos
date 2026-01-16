import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ClipboardList, Car, Wallet, CreditCard, Timer, 
  Repeat, FileText, DollarSign, Target, UserCheck,
  CheckCircle2, Circle, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PAYMENT_METHODS, PURCHASE_TIMELINES, VEHICLE_USAGE } from '@/types/qualification';
import { 
  calculateQualificationTier, 
  getTierColorClasses, 
  QUALIFICATION_TIERS,
  useQualificationConfig,
  type QualificationTier 
} from '@/hooks/useQualificationConfig';

interface Qualification {
  id: string;
  score: number;
  qualification_tier?: string | null;
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
  lead?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    source?: string | null;
    vehicle_interest?: string | null;
  };
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
}

function TierBadge({ tier, size = 'default' }: { tier: QualificationTier | null; size?: 'default' | 'lg' }) {
  if (!tier) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Não qualificado
      </Badge>
    );
  }
  
  const colors = getTierColorClasses(tier);
  const info = QUALIFICATION_TIERS[tier];
  
  if (size === 'lg') {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
          <span className="text-2xl">{info.icon}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${colors.text}`}>{tier}</span>
            <Badge className={colors.badge}>{info.label.split(' - ')[1]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{info.description}</p>
        </div>
      </div>
    );
  }
  
  return (
    <Badge className={colors.badge}>
      {info.icon} {tier}
    </Badge>
  );
}

function QualificationProgress({ 
  currentTier, 
  targetTier 
}: { 
  currentTier: QualificationTier | null;
  targetTier: QualificationTier;
}) {
  const tiers: QualificationTier[] = ['Q1', 'Q2', 'Q3'];
  const currentIndex = currentTier ? tiers.indexOf(currentTier) : -1;
  const targetIndex = tiers.indexOf(targetTier);
  
  const meetsTarget = currentIndex >= targetIndex;
  
  return (
    <Card className={`border ${meetsTarget ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {meetsTarget ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            <span className="font-medium text-sm">
              {meetsTarget ? 'Meta atingida!' : 'Em progresso'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Meta: {QUALIFICATION_TIERS[targetTier].label}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {tiers.map((tier, index) => {
            const isCompleted = currentIndex >= index;
            const isTarget = index === targetIndex;
            const tierInfo = QUALIFICATION_TIERS[tier];
            
            return (
              <div key={tier} className="flex-1 flex items-center gap-2">
                <div className={`flex flex-col items-center gap-1 flex-1`}>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted 
                      ? tier === 'Q3' ? 'bg-green-500 border-green-500' 
                        : tier === 'Q2' ? 'bg-yellow-500 border-yellow-500'
                        : 'bg-blue-500 border-blue-500'
                      : isTarget
                        ? 'border-dashed border-muted-foreground bg-muted/30'
                        : 'border-muted bg-muted/10'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : (
                      <span className="text-sm">{tierInfo.icon}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {tier}
                  </span>
                </div>
                {index < tiers.length - 1 && (
                  <div className={`h-0.5 flex-1 ${isCompleted && currentIndex > index ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function QualificationCard({ qual, index, targetTier }: { qual: Qualification; index: number; targetTier: QualificationTier }) {
  // Calculate tier from qualification data
  const tier = (qual.qualification_tier as QualificationTier) || calculateQualificationTier({
    name: 'Lead', // Assume name exists if qualification exists
    phone: 'exists', // Assume contact exists
    vehicle_interest: qual.vehicle_interest,
    source: 'exists', // Assume source exists if from negotiation
    budget_min: qual.budget_min,
    budget_max: qual.budget_max,
    payment_method: qual.payment_method,
    purchase_timeline: qual.purchase_timeline,
    has_trade_in: qual.has_trade_in,
    trade_in_vehicle: qual.trade_in_vehicle,
  });
  
  const colors = getTierColorClasses(tier);
  const paymentLabel = PAYMENT_METHODS.find(p => p.value === qual.payment_method)?.label;
  const timelineLabel = PURCHASE_TIMELINES.find(t => t.value === qual.purchase_timeline)?.label;
  const usageLabel = VEHICLE_USAGE.find(u => u.value === qual.vehicle_usage)?.label;

  // Check what fields are filled
  const fields = [
    { name: 'Veículo de interesse', filled: !!qual.vehicle_interest, value: qual.vehicle_interest },
    { name: 'Orçamento', filled: !!(qual.budget_min || qual.budget_max), value: qual.budget_min || qual.budget_max ? `${formatCurrency(qual.budget_min)} - ${formatCurrency(qual.budget_max)}` : null },
    { name: 'Forma de pagamento', filled: !!qual.payment_method, value: paymentLabel },
    { name: 'Prazo de compra', filled: !!qual.purchase_timeline, value: timelineLabel },
    { name: 'Veículo de troca', filled: qual.has_trade_in, value: qual.trade_in_vehicle },
  ];

  const filledCount = fields.filter(f => f.filled).length;
  const completionPercent = (filledCount / fields.length) * 100;

  return (
    <Card className="overflow-hidden">
      {/* Header with Tier */}
      <div className={`p-4 border-b ${colors.bg}`}>
        <div className="flex items-center justify-between">
          <TierBadge tier={tier} size="lg" />
          <div className="text-right text-xs text-muted-foreground">
            <p>Qualificação #{index + 1}</p>
            <p>{format(new Date(qual.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="mt-4 bg-background/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Completude da ficha</span>
            <span className="text-xs font-medium">{filledCount}/{fields.length} campos</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>
      </div>

      {/* Qualification Details */}
      <CardContent className="p-4 space-y-4">
        {/* Fields Checklist */}
        <div className="space-y-2">
          {fields.map((field) => (
            <div 
              key={field.name} 
              className={`flex items-center gap-3 p-2.5 rounded-lg ${
                field.filled ? 'bg-green-500/5' : 'bg-muted/30'
              }`}
            >
              {field.filled ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${field.filled ? 'font-medium' : 'text-muted-foreground'}`}>
                  {field.name}
                </p>
                {field.filled && field.value && (
                  <p className="text-xs text-muted-foreground truncate">{field.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Trade-in Details */}
        {qual.has_trade_in && qual.trade_in_vehicle && (
          <>
            <Separator />
            <div className="p-3 rounded-lg border border-dashed bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <Repeat className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Veículo para Troca
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{qual.trade_in_vehicle}</p>
                {qual.trade_in_value && (
                  <Badge variant="secondary">
                    {formatCurrency(qual.trade_in_value)}
                  </Badge>
                )}
              </div>
            </div>
          </>
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

export function LeadQualificationTab({ qualifications, lead }: LeadQualificationTabProps) {
  const { data: config } = useQualificationConfig();
  const targetTier = (config?.target_tier as QualificationTier) || 'Q2';
  
  // Calculate current tier from lead data
  const currentTier = lead ? calculateQualificationTier({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    vehicle_interest: lead.vehicle_interest,
    source: lead.source,
    budget_min: qualifications[0]?.budget_min,
    budget_max: qualifications[0]?.budget_max,
    payment_method: qualifications[0]?.payment_method,
    purchase_timeline: qualifications[0]?.purchase_timeline,
    has_trade_in: qualifications[0]?.has_trade_in,
    trade_in_vehicle: qualifications[0]?.trade_in_vehicle,
  }) : null;

  if (qualifications.length === 0 && !lead) {
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
        {/* Current Status */}
        <TierBadge tier={currentTier} size="lg" />
        
        {/* Progress toward target */}
        <QualificationProgress currentTier={currentTier} targetTier={targetTier} />

        {/* Summary Stats by Tier */}
        <div className="grid grid-cols-3 gap-3">
          {(['Q1', 'Q2', 'Q3'] as QualificationTier[]).map((tier) => {
            const count = qualifications.filter(q => 
              (q.qualification_tier as QualificationTier) === tier ||
              calculateQualificationTier({
                name: 'exists',
                phone: 'exists',
                vehicle_interest: q.vehicle_interest,
                source: 'exists',
                budget_min: q.budget_min,
                budget_max: q.budget_max,
                payment_method: q.payment_method,
                purchase_timeline: q.purchase_timeline,
              }) === tier
            ).length;
            const colors = getTierColorClasses(tier);
            const info = QUALIFICATION_TIERS[tier];
            
            return (
              <Card key={tier} className={`${colors.bg} border ${colors.border}`}>
                <CardContent className="p-3 text-center">
                  <p className={`text-2xl font-bold ${colors.text}`}>{count}</p>
                  <p className="text-xs text-muted-foreground">{info.icon} {tier}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Qualifications List */}
        {sortedQualifications.length > 0 && (
          <>
            <Separator />
            <h4 className="font-medium text-sm text-muted-foreground">Histórico de Qualificações</h4>
            {sortedQualifications.map((qual, index) => (
              <QualificationCard 
                key={qual.id} 
                qual={qual} 
                index={sortedQualifications.length - index}
                targetTier={targetTier}
              />
            ))}
          </>
        )}
      </div>
    </ScrollArea>
  );
}
