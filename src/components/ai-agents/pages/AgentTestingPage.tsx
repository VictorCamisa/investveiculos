import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  FlaskConical, 
  Play, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Bot,
  User,
  Eye,
  EyeOff,
  Wrench,
  Send
} from 'lucide-react';
import { useAIAgentTests } from '@/hooks/useAIAgents';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  toolCalls?: { name: string; result: string }[];
}

export default function AgentTestingPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: tests, isLoading } = useAIAgentTests(agentId);
  
  const [sandboxMode, setSandboxMode] = useState(true);
  const [showThinking, setShowThinking] = useState(false);
  const [showToolCalls, setShowToolCalls] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o assistente de vendas. Como posso ajudá-lo hoje?',
    }
  ]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: inputMessage };
    setChatMessages(prev => [...prev, userMessage]);

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: 'Entendi que você está interessado no Virtus TSI 2024! Temos 3 unidades disponíveis em nosso estoque. Qual cor você prefere?',
        thinking: 'O usuário mencionou Virtus TSI 2024. Devo buscar no estoque e apresentar as opções disponíveis. Vou usar a ferramenta buscar_veiculo.',
        toolCalls: [
          { name: 'buscar_veiculo', result: '3 veículos encontrados: Branco, Preto, Cinza' }
        ]
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    }, 1500);

    setInputMessage('');
  };

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
        {/* Chat de Teste */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat de Teste
            </CardTitle>
            <CardDescription>
              Simule conversas com o agente
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] px-4">
              <div className="space-y-4 py-4">
                {chatMessages.map((msg, index) => (
                  <div key={index}>
                    <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Thinking */}
                    {msg.thinking && showThinking && (
                      <div className="ml-11 mt-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-xs text-yellow-700 dark:text-yellow-400">
                          <strong>💭 Pensamento:</strong> {msg.thinking}
                        </p>
                      </div>
                    )}

                    {/* Tool Calls */}
                    {msg.toolCalls && showToolCalls && (
                      <div className="ml-11 mt-2 space-y-1">
                        {msg.toolCalls.map((tool, i) => (
                          <div key={i} className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                              <Wrench className="h-3 w-3 inline mr-1" />
                              <strong>{tool.name}:</strong> {tool.result}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2 mb-3">
                <Button
                  variant={showThinking ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowThinking(!showThinking)}
                >
                  {showThinking ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                  Pensamentos
                </Button>
                <Button
                  variant={showToolCalls ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowToolCalls(!showToolCalls)}
                >
                  {showToolCalls ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                  Ferramentas
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
