import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical, ArrowRight, Target, Lightbulb } from 'lucide-react';
import { 
  useCreateAIAgentWorkflow, 
  useUpdateAIAgentWorkflow,
  WorkflowStep,
  WorkflowTransitionRule,
  GoalHierarchyItem,
  parseWorkflowDefinition,
  serializeWorkflowDefinition
} from '@/hooks/useAIAgentWorkflows';
import type { AIAgentWorkflow } from '@/types/ai-agents';

interface WorkflowFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  workflow?: AIAgentWorkflow;
}

const WORKFLOW_TEMPLATES = [
  {
    name: 'Qualificação de Leads',
    description: 'Workflow para qualificar leads automaticamente',
    steps: [
      { id: '1', name: 'Saudação', description: 'Cumprimentar o cliente', action: 'greet', order: 0 },
      { id: '2', name: 'Identificar Interesse', description: 'Descobrir o que o cliente procura', action: 'identify_interest', order: 1 },
      { id: '3', name: 'Coletar Dados', description: 'Coletar nome, telefone, email', action: 'collect_data', order: 2 },
      { id: '4', name: 'Calcular Score', description: 'Avaliar qualidade do lead', action: 'calculate_score', order: 3 },
      { id: '5', name: 'Encaminhar', description: 'Encaminhar para vendedor ou agendar', action: 'route', order: 4 },
    ],
    transitionRules: [
      { id: '1', condition: 'Lead Score > 70', action: 'Encaminhar para vendedor' },
      { id: '2', condition: 'Interesse em test drive', action: 'Agendar visita' },
      { id: '3', condition: 'Orçamento definido', action: 'Sugerir veículos compatíveis' },
    ],
  },
  {
    name: 'Agendamento de Test Drive',
    description: 'Fluxo para agendar visitas e test drives',
    steps: [
      { id: '1', name: 'Confirmar Interesse', description: 'Confirmar veículo de interesse', action: 'confirm_interest', order: 0 },
      { id: '2', name: 'Verificar Disponibilidade', description: 'Consultar horários disponíveis', action: 'check_availability', order: 1 },
      { id: '3', name: 'Coletar Dados', description: 'Pegar dados para agendamento', action: 'collect_data', order: 2 },
      { id: '4', name: 'Confirmar Agendamento', description: 'Confirmar data e horário', action: 'confirm_appointment', order: 3 },
      { id: '5', name: 'Enviar Confirmação', description: 'Enviar mensagem de confirmação', action: 'send_confirmation', order: 4 },
    ],
    transitionRules: [
      { id: '1', condition: 'Horário confirmado', action: 'Criar negociação no CRM' },
      { id: '2', condition: 'Cliente cancelou', action: 'Reagendar' },
    ],
  },
  {
    name: 'Suporte e FAQ',
    description: 'Responder dúvidas frequentes',
    steps: [
      { id: '1', name: 'Identificar Pergunta', description: 'Entender a dúvida do cliente', action: 'identify_question', order: 0 },
      { id: '2', name: 'Buscar Resposta', description: 'Consultar base de conhecimento', action: 'search_answer', order: 1 },
      { id: '3', name: 'Responder', description: 'Fornecer resposta ao cliente', action: 'respond', order: 2 },
      { id: '4', name: 'Verificar Satisfação', description: 'Confirmar se a dúvida foi resolvida', action: 'check_satisfaction', order: 3 },
    ],
    transitionRules: [
      { id: '1', condition: 'Dúvida não resolvida', action: 'Escalar para humano' },
      { id: '2', condition: 'Cliente satisfeito', action: 'Oferecer mais ajuda' },
    ],
  },
];

const PRIORITY_OPTIONS = [
  { value: 'maximum', label: 'Máxima', color: 'bg-red-500' },
  { value: 'high', label: 'Alta', color: 'bg-orange-500' },
  { value: 'medium', label: 'Média', color: 'bg-yellow-500' },
  { value: 'low', label: 'Baixa', color: 'bg-green-500' },
];

export default function WorkflowFormDialog({ open, onOpenChange, agentId, workflow }: WorkflowFormDialogProps) {
  const createWorkflow = useCreateAIAgentWorkflow();
  const updateWorkflow = useUpdateAIAgentWorkflow();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [transitionRules, setTransitionRules] = useState<WorkflowTransitionRule[]>([]);
  const [goalHierarchy, setGoalHierarchy] = useState<GoalHierarchyItem[]>([]);

  const isEditing = !!workflow;

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      setIsDefault(workflow.is_default);
      const parsed = parseWorkflowDefinition(workflow.workflow_definition);
      setSteps(parsed.steps);
      setTransitionRules(parsed.transitionRules);
      setGoalHierarchy(parsed.goalHierarchy);
    } else {
      setName('');
      setDescription('');
      setIsDefault(false);
      setSteps([]);
      setTransitionRules([]);
      setGoalHierarchy([]);
    }
  }, [workflow, open]);

  const applyTemplate = (template: typeof WORKFLOW_TEMPLATES[0]) => {
    setName(template.name);
    setDescription(template.description);
    setSteps(template.steps);
    setTransitionRules(template.transitionRules.map(r => ({ ...r, targetStep: undefined })));
  };

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      action: '',
      order: steps.length,
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (id: string, updates: Partial<WorkflowStep>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const addTransitionRule = () => {
    const newRule: WorkflowTransitionRule = {
      id: crypto.randomUUID(),
      condition: '',
      action: '',
    };
    setTransitionRules([...transitionRules, newRule]);
  };

  const updateTransitionRule = (id: string, updates: Partial<WorkflowTransitionRule>) => {
    setTransitionRules(transitionRules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeTransitionRule = (id: string) => {
    setTransitionRules(transitionRules.filter(r => r.id !== id));
  };

  const addGoal = () => {
    const newGoal: GoalHierarchyItem = {
      id: crypto.randomUUID(),
      goal: '',
      priority: 'medium',
      order: goalHierarchy.length,
    };
    setGoalHierarchy([...goalHierarchy, newGoal]);
  };

  const updateGoal = (id: string, updates: Partial<GoalHierarchyItem>) => {
    setGoalHierarchy(goalHierarchy.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const removeGoal = (id: string) => {
    setGoalHierarchy(goalHierarchy.filter(g => g.id !== id));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const workflowData = {
      agent_id: agentId,
      name,
      description: description || null,
      is_default: isDefault,
      workflow_definition: serializeWorkflowDefinition({ steps, transitionRules, goalHierarchy }),
      priority: isDefault ? 100 : 0,
    };

    try {
      if (isEditing && workflow) {
        await updateWorkflow.mutateAsync({ id: workflow.id, ...workflowData });
      } else {
        await createWorkflow.mutateAsync(workflowData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Workflow' : 'Novo Workflow'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Templates */}
          {!isEditing && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Templates Prontos
              </Label>
              <div className="flex flex-wrap gap-2">
                {WORKFLOW_TEMPLATES.map((template) => (
                  <Button
                    key={template.name}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Workflow</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Qualificação de Leads"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do workflow"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
            <Label htmlFor="is_default">Workflow Padrão</Label>
          </div>

          {/* Steps Editor */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Etapas do Workflow</CardTitle>
                <Button onClick={addStep} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Etapa
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma etapa definida. Adicione etapas ou escolha um template.
                </p>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-muted border">
                        <GripVertical className="h-3 w-3 text-muted-foreground cursor-move" />
                        <Input
                          value={step.name}
                          onChange={(e) => updateStep(step.id, { name: e.target.value })}
                          placeholder="Nome da etapa"
                          className="border-0 h-auto p-0 bg-transparent text-sm font-medium w-32 focus-visible:ring-0"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeStep(step.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {index < steps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transition Rules */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Regras de Transição</CardTitle>
                <Button onClick={addTransitionRule} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Regra
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {transitionRules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma regra definida. Adicione regras para controlar o fluxo.
                </p>
              ) : (
                transitionRules.map((rule) => (
                  <div key={rule.id} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                    <span className="text-sm text-muted-foreground">Se</span>
                    <Input
                      value={rule.condition}
                      onChange={(e) => updateTransitionRule(rule.id, { condition: e.target.value })}
                      placeholder="condição (ex: Lead Score > 70)"
                      className="flex-1 h-8 text-sm"
                    />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={rule.action}
                      onChange={(e) => updateTransitionRule(rule.id, { action: e.target.value })}
                      placeholder="ação (ex: Encaminhar para vendedor)"
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeTransitionRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Goal Hierarchy */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Hierarquia de Metas
                </CardTitle>
                <Button onClick={addGoal} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Meta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {goalHierarchy.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Defina metas para priorizar as ações do agente.
                </p>
              ) : (
                goalHierarchy.map((goal, index) => (
                  <div key={goal.id} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <Input
                      value={goal.goal}
                      onChange={(e) => updateGoal(goal.id, { goal: e.target.value })}
                      placeholder="Descrição da meta"
                      className="flex-1 h-8 text-sm"
                    />
                    <Select
                      value={goal.priority}
                      onValueChange={(value) => updateGoal(goal.id, { priority: value as GoalHierarchyItem['priority'] })}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!name.trim() || createWorkflow.isPending || updateWorkflow.isPending}
          >
            {createWorkflow.isPending || updateWorkflow.isPending ? 'Salvando...' : (isEditing ? 'Salvar' : 'Criar Workflow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
