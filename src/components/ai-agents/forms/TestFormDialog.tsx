import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Wrench, Shield, Target, AlertTriangle } from 'lucide-react';
import { AIAgentTest } from '@/types/ai-agents';
import { 
  TEST_TYPES, 
  TEST_TEMPLATES,
  useCreateTest, 
  useUpdateTest 
} from '@/hooks/useAIAgentTests';

interface TestFormDialogProps {
  agentId: string;
  test?: AIAgentTest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function TestFormDialog({ agentId, test, open, onOpenChange }: TestFormDialogProps) {
  const [tab, setTab] = useState<'templates' | 'custom'>('templates');
  const [name, setName] = useState('');
  const [testType, setTestType] = useState('conversation');
  const [messages, setMessages] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');

  const createMutation = useCreateTest();
  const updateMutation = useUpdateTest();

  const isEditing = !!test;

  useEffect(() => {
    if (test) {
      setTab('custom');
      setName(test.name);
      setTestType(test.test_type || 'conversation');
      const scenario = test.scenario as Record<string, any> || {};
      setMessages((scenario.messages || []).join('\n'));
      setExpectedOutcome(test.expected_outcome || '');
    } else {
      resetForm();
    }
  }, [test, open]);

  const resetForm = () => {
    setTab('templates');
    setName('');
    setTestType('conversation');
    setMessages('');
    setExpectedOutcome('');
  };

  const handleTemplateSelect = (template: typeof TEST_TEMPLATES[0]) => {
    setName(template.name);
    setTestType(template.test_type);
    const scenario = template.scenario as Record<string, any>;
    setMessages((scenario.messages || []).join('\n'));
    setExpectedOutcome(template.expected_outcome);
    setTab('custom');
  };

  const handleSubmit = () => {
    const messageList = messages.split('\n').filter(m => m.trim());
    
    const data = {
      agent_id: agentId,
      name,
      test_type: testType,
      scenario: { messages: messageList },
      expected_outcome: expectedOutcome || null,
    };

    if (isEditing && test) {
      updateMutation.mutate({ id: test.id, agentId, ...data }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const typeInfo = TEST_TYPES.find(t => t.value === testType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Teste' : 'Novo Cenário de Teste'}</DialogTitle>
          <DialogDescription>
            Defina um cenário para validar o comportamento do agente
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="custom">Personalizado</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-3">
              {TEST_TEMPLATES.map((template) => {
                const Icon = getTypeIcon(template.test_type);
                const typeInfo = TEST_TYPES.find(t => t.value === template.test_type);
                
                return (
                  <Card
                    key={template.name}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {template.expected_outcome}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {typeInfo?.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            {/* Nome do Teste */}
            <div className="space-y-2">
              <Label>Nome do Cenário</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Lead interessado em financiamento"
              />
            </div>

            {/* Tipo de Teste */}
            <div className="space-y-2">
              <Label>Tipo de Teste</Label>
              <Select value={testType} onValueChange={setTestType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEST_TYPES.map((type) => {
                    const Icon = getTypeIcon(type.value);
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {typeInfo && (
                <p className="text-sm text-muted-foreground">{typeInfo.description}</p>
              )}
            </div>

            {/* Mensagens de Teste */}
            <div className="space-y-2">
              <Label>Mensagens de Teste (uma por linha)</Label>
              <Textarea
                value={messages}
                onChange={(e) => setMessages(e.target.value)}
                placeholder="Olá, quero comprar um carro&#10;Tenho R$ 50.000 de entrada&#10;Quero financiar o resto"
                rows={5}
              />
              <p className="text-sm text-muted-foreground">
                Cada linha será enviada como uma mensagem separada do usuário
              </p>
            </div>

            {/* Resultado Esperado */}
            <div className="space-y-2">
              <Label>Resultado Esperado</Label>
              <Textarea
                value={expectedOutcome}
                onChange={(e) => setExpectedOutcome(e.target.value)}
                placeholder="O agente deve identificar interesse em financiamento e calcular parcelas estimadas"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Descreva o comportamento esperado do agente para este cenário
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !name.trim() || !messages.trim()}
          >
            {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Teste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
