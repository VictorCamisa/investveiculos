import { useState } from 'react';
import { FileText, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VehicleFormBasic, BasicFormValues } from './VehicleFormBasic';
import { VehicleFormComplete, CompleteFormValues } from './VehicleFormComplete';
import { cn } from '@/lib/utils';

type FormMode = 'select' | 'basic' | 'complete';

interface CreateVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BasicFormValues | CompleteFormValues) => void;
  isLoading?: boolean;
}

export function CreateVehicleDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading 
}: CreateVehicleDialogProps) {
  const [mode, setMode] = useState<FormMode>('select');

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setMode('select');
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (data: BasicFormValues | CompleteFormValues) => {
    onSubmit(data);
    setMode('select');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn(
        "max-h-[90vh] overflow-y-auto",
        mode === 'complete' ? "max-w-3xl" : "max-w-lg"
      )}>
        <DialogHeader>
          <DialogTitle>
            {mode === 'select' && 'Cadastrar Novo Veículo'}
            {mode === 'basic' && 'Cadastro Rápido'}
            {mode === 'complete' && 'Cadastro Completo'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'select' && (
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground text-sm">
              Escolha o tipo de cadastro que deseja realizar:
            </p>
            
            <div className="grid gap-4">
              <button
                onClick={() => setMode('basic')}
                className="flex items-start gap-4 p-4 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-accent/50 transition-colors text-left"
              >
                <div className="p-3 rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Cadastro Rápido</h3>
                  <p className="text-sm text-muted-foreground">
                    Apenas os dados essenciais para começar a vender. 
                    Você pode completar as informações depois.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {['Marca', 'Modelo', 'Ano', 'Cor', 'KM', 'Preço'].map(tag => (
                      <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('complete')}
                className="flex items-start gap-4 p-4 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-accent/50 transition-colors text-left"
              >
                <div className="p-3 rounded-lg bg-green-500/10">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Cadastro Completo</h3>
                  <p className="text-sm text-muted-foreground">
                    Todas as informações financeiras para análise de 
                    viabilidade e controle de custos.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {['Dados completos', 'Custos', 'Metas', 'DRE'].map(tag => (
                      <span key={tag} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === 'basic' && (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setMode('select')}
              className="text-muted-foreground"
            >
              ← Voltar
            </Button>
            <VehicleFormBasic onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        )}

        {mode === 'complete' && (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setMode('select')}
              className="text-muted-foreground"
            >
              ← Voltar
            </Button>
            <VehicleFormComplete onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
