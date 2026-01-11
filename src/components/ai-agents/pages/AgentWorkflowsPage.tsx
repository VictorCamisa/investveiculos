import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, GitBranch, Play, Pause, Edit, Trash2, ArrowRight } from 'lucide-react';
import { useAIAgentWorkflows } from '@/hooks/useAIAgents';

export default function AgentWorkflowsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: workflows, isLoading } = useAIAgentWorkflows(agentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lógica de Planejamento</h2>
          <p className="text-muted-foreground">
            Configure workflows e regras de decisão para guiar o comportamento do agente
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Workflow
        </Button>
      </div>

      {/* Workflow padrão de Qualificação */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <GitBranch className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Qualificação de Leads
                  <Badge variant="secondary">Padrão</Badge>
                </CardTitle>
                <CardDescription>
                  Workflow principal para qualificação automática de leads
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Switch defaultChecked />
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
              <span className="text-sm font-medium">Saudação</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
              <span className="text-sm font-medium">Identificar Interesse</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
              <span className="text-sm font-medium">Coletar Dados</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
              <span className="text-sm font-medium">Calcular Score</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 text-primary">
              <span className="text-sm font-medium">Encaminhar/Agendar</span>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg border bg-muted/50">
            <h4 className="font-medium text-sm mb-2">Regras de Transição:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Se Lead Score {'>'} 70 → Encaminhar para vendedor</li>
              <li>• Se interesse em test drive → Agendar visita</li>
              <li>• Se orçamento definido → Sugerir veículos compatíveis</li>
              <li>• Se {'>'}3 interações sem qualificação → Escalar para humano</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Outros workflows */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <GitBranch className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Agendamento de Test Drive</CardTitle>
                  <CardDescription>
                    Fluxo para agendar visitas e test drives
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Switch />
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <GitBranch className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Recuperação de Leads Inativos</CardTitle>
                  <CardDescription>
                    Reengajamento de leads sem interação recente
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Switch />
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Info sobre hierarquia de metas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hierarquia de Metas</CardTitle>
          <CardDescription>
            Defina as prioridades do agente ao tomar decisões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="font-medium">1. Qualificar o lead com precisão</span>
              <Badge>Prioridade Máxima</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="font-medium">2. Agendar visita/test drive</span>
              <Badge variant="secondary">Alta</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="font-medium">3. Coletar informações de contato</span>
              <Badge variant="outline">Média</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="font-medium">4. Apresentar veículos compatíveis</span>
              <Badge variant="outline">Média</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
