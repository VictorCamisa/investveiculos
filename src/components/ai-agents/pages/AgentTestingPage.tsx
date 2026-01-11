import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  FlaskConical, 
  Play, 
  CheckCircle, 
  XCircle, 
} from 'lucide-react';
import { useAIAgentTests, useAIAgent } from '@/hooks/useAIAgents';
import { AgentChatPanel } from '@/components/ai-agents/AgentChatPanel';

export default function AgentTestingPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent } = useAIAgent(agentId);
  const { data: tests, isLoading } = useAIAgentTests(agentId);
  
  const [sandboxMode, setSandboxMode] = useState(true);

  const testScenarios = [
    { id: '1', name: 'Lead interessado em SUV', passed: true, lastRun: '10/01/2026' },
    { id: '2', name: 'Lead com orçamento limitado', passed: true, lastRun: '10/01/2026' },
    { id: '3', name: 'Lead solicitando desconto', passed: false, lastRun: '09/01/2026' },
    { id: '4', name: 'Lead pedindo test drive', passed: true, lastRun: '09/01/2026' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Testes e Validação</h2>
          <p className="text-muted-foreground">
            Teste o agente em ambiente seguro antes da implantação
          </p>
        </div>
      </div>

      {/* Sandbox Toggle */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FlaskConical className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Modo Sandbox</CardTitle>
                <CardDescription>
                  Ambiente isolado - não afeta dados reais
                </CardDescription>
              </div>
            </div>
            <Switch checked={sandboxMode} onCheckedChange={setSandboxMode} />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chat de Teste Real */}
        {agentId && (
          <AgentChatPanel
            agentId={agentId}
            agentName={agent?.name || 'Agente'}
            className="lg:row-span-2 min-h-[500px]"
          />
        )}

        {/* Cenários de Teste */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  Cenários de Teste
                </CardTitle>
                <CardDescription>
                  Testes automatizados salvos
                </CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Novo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testScenarios.map((scenario) => (
                <div 
                  key={scenario.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {scenario.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{scenario.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Último: {scenario.lastRun}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de Teste */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados dos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-green-500/10">
                <div className="text-2xl font-bold text-green-600">3</div>
                <p className="text-sm text-muted-foreground">Passou</p>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10">
                <div className="text-2xl font-bold text-red-600">1</div>
                <p className="text-sm text-muted-foreground">Falhou</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">75%</div>
                <p className="text-sm text-muted-foreground">Taxa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Criar Novo Cenário */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Cenário de Teste</CardTitle>
          <CardDescription>
            Defina um novo cenário de teste para validar o comportamento do agente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label>Nome do Cenário</Label>
              <Input placeholder="Ex: Lead interessado em financiamento" />
            </div>
            <div>
              <Label>Mensagens de Teste (uma por linha)</Label>
              <Textarea 
                placeholder="Olá, quero comprar um carro&#10;Tenho R$ 50.000 de entrada&#10;Quero financiar o resto"
                rows={4}
              />
            </div>
            <div>
              <Label>Resultado Esperado</Label>
              <Textarea 
                placeholder="O agente deve identificar interesse em financiamento e calcular parcelas estimadas"
                rows={2}
              />
            </div>
            <Button className="w-fit">
              <Plus className="h-4 w-4 mr-2" />
              Salvar Cenário
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
