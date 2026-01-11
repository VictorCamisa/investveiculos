import { useState, useMemo } from 'react';
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
import { 
  Plus, Shield, Ban, AlertTriangle, Scale, Edit, Trash2,
  ShieldCheck, ShieldOff
} from 'lucide-react';
import { 
  useAIAgentGuardrails, 
  useCreateGuardrail, 
  useUpdateGuardrail, 
  useDeleteGuardrail,
  useToggleGuardrail 
} from '@/hooks/useAIAgentGuardrails';
import { GuardrailFormDialog } from '../forms/GuardrailFormDialog';
import { AIAgentGuardrail, GUARDRAIL_TYPES, VIOLATION_ACTIONS } from '@/types/ai-agents';

export default function AgentGuardrailsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: guardrails, isLoading } = useAIAgentGuardrails(agentId);
  
  const createGuardrail = useCreateGuardrail();
  const updateGuardrail = useUpdateGuardrail();
  const deleteGuardrail = useDeleteGuardrail();
  const toggleGuardrail = useToggleGuardrail();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuardrail, setEditingGuardrail] = useState<AIAgentGuardrail | undefined>();
  const [deletingGuardrail, setDeletingGuardrail] = useState<AIAgentGuardrail | null>(null);

  const getGuardrailIcon = (type: string) => {
    switch (type) {
      case 'content_filter': return Ban;
      case 'business_rule': return Scale;
      case 'action_limit': return AlertTriangle;
      case 'moderation': return Shield;
      default: return Shield;
    }
  };

  const getActionColor = (action: string): "destructive" | "secondary" | "default" | "outline" => {
    switch (action) {
      case 'block': return 'destructive';
      case 'warn': return 'secondary';
      case 'escalate': return 'default';
      default: return 'outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'content_filter': return 'text-red-500';
      case 'business_rule': return 'text-blue-500';
      case 'action_limit': return 'text-yellow-500';
      case 'moderation': return 'text-purple-500';
      default: return 'text-muted-foreground';
    }
  };

  // Group guardrails by type
  const guardrailsByType = useMemo(() => {
    if (!guardrails) return {};
    
    return guardrails.reduce((acc, g) => {
      if (!acc[g.type]) acc[g.type] = [];
      acc[g.type].push(g);
      return acc;
    }, {} as Record<string, AIAgentGuardrail[]>);
  }, [guardrails]);

  const handleCreate = () => {
    setEditingGuardrail(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (guardrail: AIAgentGuardrail) => {
    setEditingGuardrail(guardrail);
    setIsFormOpen(true);
  };

  const handleDelete = (guardrail: AIAgentGuardrail) => {
    setDeletingGuardrail(guardrail);
  };

  const confirmDelete = () => {
    if (deletingGuardrail && agentId) {
      deleteGuardrail.mutate({ id: deletingGuardrail.id, agentId });
      setDeletingGuardrail(null);
    }
  };

  const handleToggle = (guardrail: AIAgentGuardrail) => {
    if (!agentId) return;
    toggleGuardrail.mutate({
      id: guardrail.id,
      agentId,
      isActive: !guardrail.is_active,
    });
  };

  const handleSubmit = (data: Omit<AIAgentGuardrail, 'id' | 'created_at'>) => {
    if (editingGuardrail) {
      updateGuardrail.mutate({ id: editingGuardrail.id, ...data }, {
        onSuccess: () => setIsFormOpen(false),
      });
    } else {
      createGuardrail.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  const renderGuardrailConfig = (guardrail: AIAgentGuardrail) => {
    const config = guardrail.config as Record<string, unknown>;
    
    switch (guardrail.type) {
      case 'content_filter':
        const words = config.blocked_words as string[] | undefined;
        if (words && words.length > 0) {
          return (
            <div className="flex flex-wrap gap-1 mt-2">
              {words.slice(0, 5).map((word, i) => (
                <Badge key={i} variant="outline" className="text-xs">{word}</Badge>
              ))}
              {words.length > 5 && (
                <Badge variant="outline" className="text-xs">+{words.length - 5} termos</Badge>
              )}
            </div>
          );
        }
        break;
      
      case 'action_limit':
        const limitType = config.limit_type as string;
        const maxValue = config.max_value as number;
        const limitLabels: Record<string, string> = {
          'api_calls': 'chamadas por conversa',
          'response_time': 'segundos de timeout',
          'stale_turns': 'turnos sem progresso',
          'response_tokens': 'tokens por resposta',
          'messages_per_hour': 'mensagens por hora',
        };
        return (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-bold">{maxValue}</span>
            <span className="text-sm text-muted-foreground">{limitLabels[limitType] || limitType}</span>
          </div>
        );
      
      case 'moderation':
        const modType = config.moderation_type as string;
        const threshold = config.threshold as number;
        const modLabels: Record<string, string> = {
          'offensive': 'Conteúdo ofensivo',
          'profanity': 'Linguagem inadequada',
          'pii_exposure': 'Dados pessoais',
          'hate_speech': 'Discurso de ódio',
          'violence': 'Conteúdo violento',
        };
        return (
          <div className="flex items-center justify-between mt-2 p-2 rounded bg-muted">
            <span className="text-sm">{modLabels[modType] || modType}</span>
            <span className="text-xs text-muted-foreground">
              Sensibilidade: {Math.round((threshold || 0.8) * 100)}%
            </span>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const hasGuardrails = guardrails && guardrails.length > 0;
  const activeCount = guardrails?.filter(g => g.is_active).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Guardrails e Segurança</h2>
          <p className="text-muted-foreground">
            Defina limites e regras para garantir comportamento seguro do agente
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Guardrail
        </Button>
      </div>

      {/* Stats */}
      {hasGuardrails && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Guardrails</CardDescription>
              <CardTitle className="text-2xl">{guardrails.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                Ativos
              </CardDescription>
              <CardTitle className="text-2xl text-green-600">{activeCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <ShieldOff className="h-4 w-4 text-muted-foreground" />
                Inativos
              </CardDescription>
              <CardTitle className="text-2xl text-muted-foreground">
                {guardrails.length - activeCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tipos Configurados</CardDescription>
              <CardTitle className="text-2xl">{Object.keys(guardrailsByType).length}/4</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!hasGuardrails && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum Guardrail Configurado</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Adicione regras de segurança para controlar o comportamento do agente,
              filtrar conteúdo e definir limites de ação.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Guardrail
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Guardrails by Type */}
      {hasGuardrails && (
        <div className="space-y-6">
          {GUARDRAIL_TYPES.map(({ value: typeValue, label: typeLabel }) => {
            const typeGuardrails = guardrailsByType[typeValue];
            if (!typeGuardrails || typeGuardrails.length === 0) return null;

            const TypeIcon = getGuardrailIcon(typeValue);

            return (
              <div key={typeValue}>
                <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${getTypeColor(typeValue)}`}>
                  <TypeIcon className="h-5 w-5" />
                  {typeLabel}
                  <Badge variant="outline" className="ml-2">
                    {typeGuardrails.length}
                  </Badge>
                </h3>
                
                <div className="grid gap-4">
                  {typeGuardrails.map((guardrail) => (
                    <Card 
                      key={guardrail.id}
                      className={`transition-opacity ${!guardrail.is_active ? 'opacity-60' : ''}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-base">{guardrail.name}</CardTitle>
                            <Badge variant={getActionColor(guardrail.action_on_violation)}>
                              {VIOLATION_ACTIONS.find(a => a.value === guardrail.action_on_violation)?.label || guardrail.action_on_violation}
                            </Badge>
                            {!guardrail.is_active && (
                              <Badge variant="outline">Inativo</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={guardrail.is_active}
                              onCheckedChange={() => handleToggle(guardrail)}
                            />
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(guardrail)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(guardrail)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {guardrail.description && (
                          <p className="text-sm text-muted-foreground">
                            {guardrail.description}
                          </p>
                        )}
                        {renderGuardrailConfig(guardrail)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      {agentId && (
        <GuardrailFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          guardrail={editingGuardrail}
          agentId={agentId}
          onSubmit={handleSubmit}
          isLoading={createGuardrail.isPending || updateGuardrail.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingGuardrail} onOpenChange={() => setDeletingGuardrail(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Guardrail</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o guardrail "{deletingGuardrail?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
