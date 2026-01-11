import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Shield, Ban, AlertTriangle, Scale, Edit, Trash2 } from 'lucide-react';
import { useAIAgentGuardrails } from '@/hooks/useAIAgents';
import { GUARDRAIL_TYPES, VIOLATION_ACTIONS } from '@/types/ai-agents';

export default function AgentGuardrailsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: guardrails, isLoading } = useAIAgentGuardrails(agentId);

  const getGuardrailIcon = (type: string) => {
    switch (type) {
      case 'content_filter': return Ban;
      case 'business_rule': return Scale;
      case 'action_limit': return AlertTriangle;
      case 'moderation': return Shield;
      default: return Shield;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'block': return 'destructive';
      case 'warn': return 'secondary';
      case 'escalate': return 'default';
      default: return 'outline';
    }
  };

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
          <h2 className="text-2xl font-bold">Guardrails e Segurança</h2>
          <p className="text-muted-foreground">
            Defina limites e regras para garantir comportamento seguro do agente
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Guardrail
        </Button>
      </div>

      {/* Guardrails por categoria */}
      <div className="space-y-6">
        {/* Filtros de Conteúdo */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Filtros de Conteúdo
          </h3>
          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">Palavras Proibidas</CardTitle>
                    <Badge variant="destructive">Bloquear</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked />
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Lista de termos que o agente não pode usar nas respostas
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">concorrente X</Badge>
                  <Badge variant="outline">preço de fábrica</Badge>
                  <Badge variant="outline">garantia vitalícia</Badge>
                  <Badge variant="outline">+12 termos</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">Tópicos Sensíveis</CardTitle>
                    <Badge variant="secondary">Avisar</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked />
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Política, religião, assuntos polêmicos → Redirecionar educadamente
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Regras de Negócio */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Regras de Negócio
          </h3>
          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">Política de Descontos</CardTitle>
                    <Badge>Escalar</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked />
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Nunca prometer descontos. Se solicitado, escalar para vendedor humano.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">Verificar Disponibilidade</CardTitle>
                    <Badge variant="destructive">Bloquear</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked />
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sempre consultar estoque antes de confirmar disponibilidade de veículo.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">Informações de Financiamento</CardTitle>
                    <Badge variant="secondary">Avisar</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked />
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Valores de parcela são estimativas. Sujeito a análise de crédito.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Limites de Ação */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Limites de Ação
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Chamadas de API por Conversa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">10</span>
                  <span className="text-sm text-muted-foreground">máximo por sessão</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tempo de Resposta Máximo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">30s</span>
                  <span className="text-sm text-muted-foreground">antes de timeout</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Turnos Antes de Escalar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">5</span>
                  <span className="text-sm text-muted-foreground">sem progresso</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tokens por Resposta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">500</span>
                  <span className="text-sm text-muted-foreground">máximo</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Moderação */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Moderação de Saída
          </h3>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Moderação Automática</CardTitle>
                  <CardDescription>
                    Filtrar respostas através de API de moderação
                  </CardDescription>
                </div>
                <Switch defaultChecked />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span>Conteúdo ofensivo</span>
                  <Badge variant="destructive">Bloquear</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span>Linguagem inadequada</span>
                  <Badge variant="destructive">Bloquear</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span>Informações pessoais expostas</span>
                  <Badge>Escalar</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
