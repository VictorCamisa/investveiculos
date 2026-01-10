import { cn } from '@/lib/utils';
import { 
  getScoreClassification, 
  getClassificationLabel,
  getClassificationColor,
  getClassificationBackground 
} from '@/hooks/useLeadQualification';
import type { ScoreBreakdown } from '@/types/qualification';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface LeadScoreIndicatorProps {
  score: ScoreBreakdown;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
}

export function LeadScoreIndicator({ 
  score, 
  size = 'md',
  showBreakdown = true 
}: LeadScoreIndicatorProps) {
  const classification = getScoreClassification(score.total);
  const label = getClassificationLabel(classification);
  const colorClass = getClassificationColor(classification);
  const bgClass = getClassificationBackground(classification);
  
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-28 h-28 text-4xl',
  };
  
  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const ScoreCircle = (
    <div className={cn(
      'rounded-full border-2 flex flex-col items-center justify-center font-bold',
      sizeClasses[size],
      bgClass,
      colorClass
    )}>
      <span>{score.total}</span>
      {size !== 'sm' && (
        <span className={cn('font-normal', labelSizeClasses[size])}>
          {label}
        </span>
      )}
    </div>
  );

  if (!showBreakdown) {
    return ScoreCircle;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-2 cursor-help">
            {ScoreCircle}
            
            {size !== 'sm' && (
              <div className="w-full space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Engajamento</span>
                  <span className="font-medium">{score.engagement}/40</span>
                </div>
                <Progress value={(score.engagement / 40) * 100} className="h-1.5" />
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Intenção</span>
                  <span className="font-medium">{score.intent}/30</span>
                </div>
                <Progress value={(score.intent / 30) * 100} className="h-1.5" />
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Dados</span>
                  <span className="font-medium">{score.completeness}/30</span>
                </div>
                <Progress value={(score.completeness / 30) * 100} className="h-1.5" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">Composição do Score</p>
            <div className="space-y-1 text-sm">
              <p><strong>Engajamento ({score.engagement}/40):</strong> Baseado na quantidade de mensagens e velocidade de resposta</p>
              <p><strong>Intenção ({score.intent}/30):</strong> Palavras-chave que indicam interesse de compra</p>
              <p><strong>Dados ({score.completeness}/30):</strong> Informações preenchidas na ficha</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact badge version for cards
interface LeadScoreBadgeProps {
  score: number;
  className?: string;
}

export function LeadScoreBadge({ score, className }: LeadScoreBadgeProps) {
  const classification = getScoreClassification(score);
  const colorClass = getClassificationColor(classification);
  const bgClass = getClassificationBackground(classification);
  
  const emoji = classification === 'hot' ? '🔥' : classification === 'warm' ? '🌡️' : '❄️';
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
      bgClass,
      colorClass,
      className
    )}>
      {score} {emoji}
    </span>
  );
}
