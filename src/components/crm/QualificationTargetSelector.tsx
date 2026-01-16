import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Target, ChevronDown, Check, Loader2 } from 'lucide-react';
import { 
  useQualificationConfig, 
  useUpdateQualificationConfig, 
  QUALIFICATION_TIERS,
  type QualificationTier 
} from '@/hooks/useQualificationConfig';
import { usePermissions } from '@/hooks/usePermissions';

type QualificationTierKey = 'Q1' | 'Q2' | 'Q3';

export function QualificationTargetSelector() {
  const { data: config, isLoading } = useQualificationConfig();
  const updateConfig = useUpdateQualificationConfig();
  const { isGerente } = usePermissions();
  
  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Carregando...
      </Button>
    );
  }
  
  const currentTier = config?.target_tier as QualificationTier || 'Q2';
  const tierInfo = QUALIFICATION_TIERS[currentTier];
  
  const handleSelect = (tier: QualificationTier) => {
    if (tier !== currentTier) {
      updateConfig.mutate(tier);
    }
  };
  
  // Non-managers just see the current target
  if (!isGerente) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
        <Target className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Meta:</span>
        <Badge 
          className={`${
            currentTier === 'Q3' ? 'bg-green-500' :
            currentTier === 'Q2' ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
        >
          {tierInfo.icon} {tierInfo.label}
        </Badge>
      </div>
    );
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          disabled={updateConfig.isPending}
        >
          {updateConfig.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Target className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Meta:</span>
          <Badge 
            className={`${
              currentTier === 'Q3' ? 'bg-green-500' :
              currentTier === 'Q2' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
          >
            {tierInfo.icon} {currentTier}
          </Badge>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Meta de Qualificação</p>
            <p className="text-xs text-muted-foreground">
              Defina o nível mínimo desejado para considerar um lead qualificado
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {(Object.keys(QUALIFICATION_TIERS) as QualificationTier[]).map((tier) => {
          const info = QUALIFICATION_TIERS[tier];
          const isSelected = tier === currentTier;
          
          return (
            <DropdownMenuItem
              key={tier}
              onClick={() => handleSelect(tier)}
              className="flex items-start gap-3 p-3 cursor-pointer"
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                tier === 'Q3' ? 'bg-green-500/10' :
                tier === 'Q2' ? 'bg-yellow-500/10' : 'bg-blue-500/10'
              }`}>
                <span className="text-lg">{info.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{info.label}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {info.description}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
