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
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  FlaskConical, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  Edit,
  Trash2,
  PlayCircle,
  MessageSquare,
  Wrench,
  Shield,
  Target,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useAIAgent } from '@/hooks/useAIAgents';
import { 
  useAIAgentTests,
  useDeleteTest,
  useRunTest,
  useRunAllTests,
  TEST_TYPES,
} from '@/hooks/useAIAgentTests';
import { TestFormDialog } from '../forms/TestFormDialog';
import { AgentChatPanel } from '@/components/ai-agents/AgentChatPanel';
import { AIAgentTest } from '@/types/ai-agents';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AgentTestingPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent } = useAIAgent(agentId);
  const { data: tests, isLoading } = useAIAgentTests(agentId);
  
  const [sandboxMode, setSandboxMode] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<AIAgentTest | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<AIAgentTest | null>(null);

  const deleteMutation = useDeleteTest();
  const runTestMutation = useRunTest();
  const runAllMutation = useRunAllTests();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'conversation': return MessageSquare;
      case 'tool_call': return Wrench;
      case 'guardrail': return Shield;
      case 'qualification': return Target;
      case 'edge_case': return AlertTriangle;
      default: return MessageSquare;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'conversation': return 'text-blue-500 bg-blue-500/10';
      case 'tool_call': return 'text-purple-500 bg-purple-500/10';
      case 'guardrail': return 'text-orange-500 bg-orange-500/10';
      case 'qualification': return 'text-green-500 bg-green-500/10';
      case 'edge_case': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const handleEdit = (test: AIAgentTest) => {
    setEditingTest(test);
    setDialogOpen(true);
  };

  const handleDelete = (test: AIAgentTest) => {
    setTestToDelete(test);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (testToDelete && agentId) {
      deleteMutation.mutate({ id: testToDelete.id, agentId });
      setDeleteDialogOpen(false);
      setTestToDelete(null);
    }
  };

  const handleRunTest = (test: AIAgentTest) => {
    if (agentId) {
      runTestMutation.mutate({ id: test.id, agentId });
    }
  };

  const handleRunAllTests = () => {
    if (agentId && tests && tests.length > 0) {
      runAllMutation.mutate({ 
        agentId, 
        testIds: tests.map(t => t.id) 
      });
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTest(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Stats
  const stats = {
    total: tests?.length || 0,
    passed: tests?.filter(t => t.passed === true).length || 0,
    failed: tests?.filter(t => t.passed === false).length || 0,
    pending: tests?.filter(t => t.passed === null).length || 0,
  };
  const passRate = stats.total > 0 && (stats.passed + stats.failed) > 0
    ? Math.round((stats.passed / (stats.passed + stats.failed)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Testes e Validação</h2>
          <p className="text-muted-foreground">
            Teste o agente em ambiente seguro antes da implantação
          </p>
        </div>
        <div className="flex gap-2">
          {tests && tests.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleRunAllTests}
              disabled={runAllMutation.isPending}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              {runAllMutation.isPending ? 'Executando...' : 'Executar Todos'}
            </Button>
          )}
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Teste
          </Button>
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.passed}</p>
                <p className="text-sm text-muted-foreground">Passou</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">Falhou</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{passRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            </div>
          </CardHeader>
          <CardContent>
            {tests?.length === 0 ? (
              <div className="text-center py-8">
                <FlaskConical className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-3">Nenhum teste criado ainda</p>
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Criar Primeiro Teste
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {tests?.map((test) => {
                  const TypeIcon = getTypeIcon(test.test_type || 'conversation');
                  const typeInfo = TEST_TYPES.find(t => t.value === test.test_type);
                  const isRunning = runTestMutation.isPending && runTestMutation.variables?.id === test.id;
                  
                  return (
                    <div 
                      key={test.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {test.passed === null ? (
                          <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        ) : test.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{test.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <TypeIcon className="h-3 w-3 mr-1" />
                              {typeInfo?.label || test.test_type}
                            </Badge>
                            {test.executed_at && (
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(test.executed_at), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRunTest(test)}
                          disabled={isRunning}
                        >
                          {isRunning ? (
                            <RotateCcw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(test)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(test)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados Detalhados */}
        {tests && tests.some(t => t.actual_outcome) && (
          <Card>
            <CardHeader>
              <CardTitle>Últimos Resultados</CardTitle>
              <CardDescription>Detalhes das execuções recentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tests
                .filter(t => t.actual_outcome)
                .slice(0, 3)
                .map((test) => (
                  <div key={test.id} className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      {test.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium text-sm">{test.name}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Esperado: </span>
                        <span>{test.expected_outcome}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Resultado: </span>
                        <span className={test.passed ? 'text-green-600' : 'text-red-600'}>
                          {test.actual_outcome}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Formulário */}
      {agentId && (
        <TestFormDialog
          agentId={agentId}
          test={editingTest}
          open={dialogOpen}
          onOpenChange={handleDialogClose}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Teste</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o teste "{testToDelete?.name}"? Esta ação não pode ser desfeita.
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
