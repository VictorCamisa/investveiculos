import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Plus, GitBranch, Edit, Trash2, ArrowRight, Target, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  useAIAgentWorkflows, 
  useDeleteAIAgentWorkflow, 
  useToggleAIAgentWorkflow,
  useSetDefaultWorkflow,
  parseWorkflowDefinition 
} from '@/hooks/useAIAgentWorkflows';
import WorkflowFormDialog from '../forms/WorkflowFormDialog';
import type { AIAgentWorkflow } from '@/types/ai-agents';

const PRIORITY_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  maximum: { label: 'Máxima', variant: 'default' },
  high: { label: 'Alta', variant: 'secondary' },
  medium: { label: 'Média', variant: 'outline' },
  low: { label: 'Baixa', variant: 'outline' },
};

export default function AgentWorkflowsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: workflows = [], isLoading } = useAIAgentWorkflows(agentId);
  const deleteWorkflow = useDeleteAIAgentWorkflow();
  const toggleWorkflow = useToggleAIAgentWorkflow();
  const setDefaultWorkflow = useSetDefaultWorkflow();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AIAgentWorkflow | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<AIAgentWorkflow | null>(null);
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedWorkflows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedWorkflows(newExpanded);
  };

  const handleEdit = (workflow: AIAgentWorkflow) => {
    setSelectedWorkflow(workflow);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedWorkflow(undefined);
    setFormOpen(true);
  };

  const handleDelete = (workflow: AIAgentWorkflow) => {
    setWorkflowToDelete(workflow);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (workflowToDelete && agentId) {
      deleteWorkflow.mutate({ id: workflowToDelete.id, agentId });
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }
  };

  const handleToggle = (workflow: AIAgentWorkflow) => {
    if (agentId) {
      toggleWorkflow.mutate({ 
        id: workflow.id, 
        agentId, 
        isActive: !workflow.is_active 
      });
    }
  };

  const handleSetDefault = (workflow: AIAgentWorkflow) => {
    if (agentId && !workflow.is_default) {
      setDefaultWorkflow.mutate({ id: workflow.id, agentId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const defaultWorkflow = workflows.find(w => w.is_default);
  const otherWorkflows = workflows.filter(w => !w.is_default);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lógica de Planejamento</h2>
          <p className="text-muted-foreground">
            Configure workflows e regras de decisão para guiar o comportamento do agente
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Workflow
        </Button>
      </div>

      {/* Empty State */}
      {workflows.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum workflow configurado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie workflows para definir como o agente deve conduzir as conversas.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Workflow
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Default Workflow */}
      {defaultWorkflow && (
        <WorkflowCard
          workflow={defaultWorkflow}
          isExpanded={expandedWorkflows.has(defaultWorkflow.id)}
          onToggleExpand={() => toggleExpanded(defaultWorkflow.id)}
          onEdit={() => handleEdit(defaultWorkflow)}
          onDelete={() => handleDelete(defaultWorkflow)}
          onToggle={() => handleToggle(defaultWorkflow)}
          onSetDefault={() => {}}
          isDefault
        />
      )}

      {/* Other Workflows */}
      {otherWorkflows.length > 0 && (
        <div className="grid gap-4">
          {otherWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              isExpanded={expandedWorkflows.has(workflow.id)}
              onToggleExpand={() => toggleExpanded(workflow.id)}
              onEdit={() => handleEdit(workflow)}
              onDelete={() => handleDelete(workflow)}
              onToggle={() => handleToggle(workflow)}
              onSetDefault={() => handleSetDefault(workflow)}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      {agentId && (
        <WorkflowFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          agentId={agentId}
          workflow={selectedWorkflow}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o workflow "{workflowToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface WorkflowCardProps {
  workflow: AIAgentWorkflow;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onSetDefault: () => void;
  isDefault?: boolean;
}

function WorkflowCard({ 
  workflow, 
  isExpanded, 
  onToggleExpand, 
  onEdit, 
  onDelete, 
  onToggle, 
  onSetDefault,
  isDefault 
}: WorkflowCardProps) {
  const definition = parseWorkflowDefinition(workflow.workflow_definition);

  return (
    <Card className={isDefault ? 'border-primary/50 bg-primary/5' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDefault ? 'bg-primary/20' : 'bg-muted'}`}>
              <GitBranch className={`h-5 w-5 ${isDefault ? 'text-primary' : ''}`} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {workflow.name}
                {isDefault && <Badge variant="secondary">Padrão</Badge>}
                {!workflow.is_active && <Badge variant="outline">Inativo</Badge>}
              </CardTitle>
              <CardDescription>
                {workflow.description || 'Sem descrição'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isDefault && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onSetDefault}
                title="Definir como padrão"
              >
                <Star className="h-4 w-4" />
              </Button>
            )}
            <Switch 
              checked={workflow.is_active} 
              onCheckedChange={onToggle}
            />
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive" 
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggleExpand}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Steps */}
          {definition.steps.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Etapas:</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {definition.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className="px-3 py-2 rounded-lg bg-muted">
                      <span className="text-sm font-medium">{step.name || `Etapa ${index + 1}`}</span>
                    </div>
                    {index < definition.steps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transition Rules */}
          {definition.transitionRules.length > 0 && (
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium text-sm mb-2">Regras de Transição:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {definition.transitionRules.map((rule) => (
                  <li key={rule.id}>• Se {rule.condition} → {rule.action}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Goal Hierarchy */}
          {definition.goalHierarchy.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Hierarquia de Metas:
              </h4>
              <div className="space-y-2">
                {definition.goalHierarchy.map((goal, index) => (
                  <div key={goal.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                    <span className="text-sm">
                      {index + 1}. {goal.goal || 'Meta não definida'}
                    </span>
                    <Badge variant={PRIORITY_BADGES[goal.priority]?.variant || 'outline'}>
                      {PRIORITY_BADGES[goal.priority]?.label || goal.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {definition.steps.length === 0 && definition.transitionRules.length === 0 && definition.goalHierarchy.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Este workflow está vazio. Clique em Editar para configurar etapas e regras.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
