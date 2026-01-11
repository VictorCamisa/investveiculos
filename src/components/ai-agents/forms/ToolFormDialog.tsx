import { useEffect, useState } from 'react';
import { useCreateAIAgentTool, useUpdateAIAgentTool } from '@/hooks/useAIAgents';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Car, Users, Calendar, MessageSquare, BarChart3 } from 'lucide-react';
import type { AIAgentTool } from '@/types/ai-agents';
import { toast } from 'sonner';

interface ToolFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  tool?: AIAgentTool | null;
}

// Templates de orquestração prontos
const ORCHESTRATION_TEMPLATES = [
  {
    id: 'search_stock',
    label: 'Consultar Estoque',
    icon: Car,
    rule: 'Quando o cliente perguntar sobre veículos, carros, motos ou preços, buscar no estoque'
  },
  {
    id: 'create_lead',
    label: 'Criar Lead',
    icon: Users,
    rule: 'Quando o cliente fornecer nome ou telefone, criar um lead no CRM'
  },
  {
    id: 'schedule_visit',
    label: 'Agendar Visita',
    icon: Calendar,
    rule: 'Quando o cliente quiser visitar a loja ou fazer test-drive, agendar uma visita'
  },
  {
    id: 'send_whatsapp',
    label: 'Enviar WhatsApp',
    icon: MessageSquare,
    rule: 'Quando precisar enviar fotos ou informações, usar o WhatsApp'
  },
  {
    id: 'sales_stats',
    label: 'Ver Estatísticas',
    icon: BarChart3,
    rule: 'Quando perguntarem sobre performance ou vendas, mostrar estatísticas'
  }
];

export function ToolFormDialog({ open, onOpenChange, agentId, tool }: ToolFormDialogProps) {
  const createTool = useCreateAIAgentTool();
  const updateTool = useUpdateAIAgentTool();
  const isEditing = !!tool;

  const [rule, setRule] = useState('');

  useEffect(() => {
    if (tool) {
      setRule(tool.orchestration_rules || tool.description || '');
    } else {
      setRule('');
    }
  }, [tool, open]);

  const handleTemplateClick = (template: typeof ORCHESTRATION_TEMPLATES[0]) => {
    setRule(template.rule);
  };

  const onSubmit = async () => {
    if (!rule.trim()) {
      toast.error('Escreva uma regra de orquestração');
      return;
    }

    try {
      const toolData = {
        agent_id: agentId,
        name: `regra_${Date.now()}`,
        description: rule,
        orchestration_rules: rule,
        function_schema: { type: 'orchestration_rule' },
        auth_method: 'none',
        is_active: true
      };

      if (isEditing) {
        await updateTool.mutateAsync({ 
          id: tool.id, 
          description: rule,
          orchestration_rules: rule 
        });
      } else {
        await createTool.mutateAsync(toolData);
      }

      onOpenChange(false);
      toast.success(isEditing ? 'Regra atualizada!' : 'Regra criada com sucesso!');
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Erro ao salvar regra');
    }
  };

  const isPending = createTool.isPending || updateTool.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Regra' : 'Nova Regra de Orquestração'}</DialogTitle>
          <DialogDescription>
            Defina em linguagem natural quando o agente deve usar uma capacidade específica.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Templates */}
          {!isEditing && (
            <div>
              <Label className="text-sm">Templates rápidos</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ORCHESTRATION_TEMPLATES.map(template => {
                  const Icon = template.icon;
                  return (
                    <Button 
                      key={template.id}
                      variant="outline" 
                      size="sm"
                      type="button"
                      onClick={() => handleTemplateClick(template)}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {template.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regra */}
          <div>
            <Label htmlFor="rule">Regra de Orquestração</Label>
            <Textarea
              id="rule"
              placeholder="Ex: Quando o cliente perguntar sobre preços, buscar veículos disponíveis no estoque"
              value={rule}
              onChange={(e) => setRule(e.target.value)}
              className="min-h-[100px] mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Escreva em linguagem natural quando e como o agente deve agir
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={isPending || !rule.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Salvar' : 'Criar Regra'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
