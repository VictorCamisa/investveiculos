import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Ban, Scale, AlertTriangle, Shield, Plus, X, 
  Sparkles, FileCode, Zap
} from 'lucide-react';
import { AIAgentGuardrail, GUARDRAIL_TYPES, VIOLATION_ACTIONS } from '@/types/ai-agents';
import { GUARDRAIL_TEMPLATES, GuardrailTemplate } from '@/hooks/useAIAgentGuardrails';

interface GuardrailFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guardrail?: AIAgentGuardrail;
  agentId: string;
  onSubmit: (data: Omit<AIAgentGuardrail, 'id' | 'created_at'>) => void;
  isLoading?: boolean;
}

export function GuardrailFormDialog({
  open,
  onOpenChange,
  guardrail,
  agentId,
  onSubmit,
  isLoading,
}: GuardrailFormDialogProps) {
  const [activeTab, setActiveTab] = useState<'template' | 'custom'>(guardrail ? 'custom' : 'template');
  
  // Form state
  const [type, setType] = useState(guardrail?.type || 'content_filter');
  const [name, setName] = useState(guardrail?.name || '');
  const [description, setDescription] = useState(guardrail?.description || '');
  const [actionOnViolation, setActionOnViolation] = useState(guardrail?.action_on_violation || 'warn');
  const [isActive, setIsActive] = useState(guardrail?.is_active ?? true);
  const [config, setConfig] = useState<Record<string, unknown>>(guardrail?.config || {});

  // Type-specific config state
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [limitValue, setLimitValue] = useState(10);
  const [limitType, setLimitType] = useState('api_calls');
  const [moderationType, setModerationTypes] = useState('offensive');
  const [threshold, setThreshold] = useState(0.8);
  const [customRule, setCustomRule] = useState('');
  const [escalationMessage, setEscalationMessage] = useState('');
  const [redirectMessage, setRedirectMessage] = useState('');

  // Reset form when dialog opens/closes or guardrail changes
  useEffect(() => {
    if (guardrail) {
      setType(guardrail.type);
      setName(guardrail.name);
      setDescription(guardrail.description || '');
      setActionOnViolation(guardrail.action_on_violation);
      setIsActive(guardrail.is_active);
      setConfig(guardrail.config);
      
      // Parse config based on type
      const cfg = guardrail.config as Record<string, unknown>;
      if (cfg.blocked_words) setBlockedWords(cfg.blocked_words as string[]);
      if (cfg.max_value) setLimitValue(cfg.max_value as number);
      if (cfg.limit_type) setLimitType(cfg.limit_type as string);
      if (cfg.moderation_type) setModerationTypes(cfg.moderation_type as string);
      if (cfg.threshold) setThreshold(cfg.threshold as number);
      if (cfg.rule) setCustomRule(cfg.rule as string);
      if (cfg.escalation_message) setEscalationMessage(cfg.escalation_message as string);
      if (cfg.redirect_message) setRedirectMessage(cfg.redirect_message as string);
      
      setActiveTab('custom');
    } else {
      resetForm();
    }
  }, [guardrail, open]);

  const resetForm = () => {
    setType('content_filter');
    setName('');
    setDescription('');
    setActionOnViolation('warn');
    setIsActive(true);
    setConfig({});
    setBlockedWords([]);
    setNewWord('');
    setLimitValue(10);
    setLimitType('api_calls');
    setModerationTypes('offensive');
    setThreshold(0.8);
    setCustomRule('');
    setEscalationMessage('');
    setRedirectMessage('');
  };

  const handleTemplateSelect = (template: GuardrailTemplate) => {
    setType(template.type);
    setName(template.name);
    setDescription(template.description);
    setActionOnViolation(template.action_on_violation);
    setConfig(template.config);
    
    // Parse template config
    const cfg = template.config;
    if (cfg.blocked_words) setBlockedWords(cfg.blocked_words as string[]);
    if (cfg.max_value) setLimitValue(cfg.max_value as number);
    if (cfg.limit_type) setLimitType(cfg.limit_type as string);
    if (cfg.moderation_type) setModerationTypes(cfg.moderation_type as string);
    if (cfg.threshold) setThreshold(cfg.threshold as number);
    if (cfg.rule) setCustomRule(cfg.rule as string);
    if (cfg.escalation_message) setEscalationMessage(cfg.escalation_message as string);
    if (cfg.redirect_message) setRedirectMessage(cfg.redirect_message as string);
    
    setActiveTab('custom');
  };

  const addBlockedWord = () => {
    if (newWord.trim() && !blockedWords.includes(newWord.trim())) {
      setBlockedWords([...blockedWords, newWord.trim()]);
      setNewWord('');
    }
  };

  const removeBlockedWord = (word: string) => {
    setBlockedWords(blockedWords.filter(w => w !== word));
  };

  const buildConfig = (): Record<string, unknown> => {
    switch (type) {
      case 'content_filter':
        return {
          blocked_words: blockedWords,
          match_type: 'contains',
          case_sensitive: false,
          redirect_message: redirectMessage || undefined,
        };
      case 'business_rule':
        return {
          rule: customRule,
          escalation_message: escalationMessage || undefined,
        };
      case 'action_limit':
        return {
          limit_type: limitType,
          max_value: limitValue,
          per: 'conversation',
          escalation_message: escalationMessage || undefined,
        };
      case 'moderation':
        return {
          moderation_type: moderationType,
          use_api: true,
          threshold,
        };
      default:
        return config;
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSubmit({
      agent_id: agentId,
      type,
      name: name.trim(),
      description: description.trim() || null,
      config: buildConfig(),
      action_on_violation: actionOnViolation,
      is_active: isActive,
    });
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'content_filter': return Ban;
      case 'business_rule': return Scale;
      case 'action_limit': return AlertTriangle;
      case 'moderation': return Shield;
      default: return Shield;
    }
  };

  const getTypeColor = (t: string) => {
    switch (t) {
      case 'content_filter': return 'text-red-500';
      case 'business_rule': return 'text-blue-500';
      case 'action_limit': return 'text-yellow-500';
      case 'moderation': return 'text-purple-500';
      default: return 'text-muted-foreground';
    }
  };

  const templatesByType = GUARDRAIL_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.type]) acc[template.type] = [];
    acc[template.type].push(template);
    return acc;
  }, {} as Record<string, GuardrailTemplate[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {guardrail ? 'Editar Guardrail' : 'Novo Guardrail'}
          </DialogTitle>
          <DialogDescription>
            Configure regras de segurança e limites para o comportamento do agente
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'template' | 'custom')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="template" disabled={!!guardrail}>
              <Sparkles className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="custom">
              <FileCode className="h-4 w-4 mr-2" />
              {guardrail ? 'Configuração' : 'Personalizado'}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4 pr-4">
            <TabsContent value="template" className="mt-0 space-y-6">
              {Object.entries(templatesByType).map(([typeKey, templates]) => {
                const TypeIcon = getTypeIcon(typeKey);
                const typeLabel = GUARDRAIL_TYPES.find(t => t.value === typeKey)?.label || typeKey;
                
                return (
                  <div key={typeKey}>
                    <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${getTypeColor(typeKey)}`}>
                      <TypeIcon className="h-4 w-4" />
                      {typeLabel}
                    </h4>
                    <div className="grid gap-2">
                      {templates.map((template, idx) => (
                        <Card 
                          key={idx} 
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <CardHeader className="py-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">{template.name}</CardTitle>
                              <Badge variant={
                                template.action_on_violation === 'block' ? 'destructive' :
                                template.action_on_violation === 'escalate' ? 'default' : 'secondary'
                              }>
                                {VIOLATION_ACTIONS.find(a => a.value === template.action_on_violation)?.label}
                              </Badge>
                            </div>
                            <CardDescription className="text-xs">
                              {template.description}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="custom" className="mt-0 space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Guardrail</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GUARDRAIL_TYPES.map((t) => {
                          const Icon = getTypeIcon(t.value);
                          return (
                            <SelectItem key={t.value} value={t.value}>
                              <span className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${getTypeColor(t.value)}`} />
                                {t.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ação em Violação</Label>
                    <Select value={actionOnViolation} onValueChange={setActionOnViolation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VIOLATION_ACTIONS.map((action) => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Verificar Disponibilidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o comportamento esperado deste guardrail..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label>Guardrail ativo</Label>
                </div>
              </div>

              {/* Type-specific configuration */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Configuração Específica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {type === 'content_filter' && (
                    <>
                      <div className="space-y-2">
                        <Label>Palavras/Termos Bloqueados</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            placeholder="Digite um termo..."
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBlockedWord())}
                          />
                          <Button type="button" onClick={addBlockedWord} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {blockedWords.map((word) => (
                            <Badge key={word} variant="secondary" className="gap-1">
                              {word}
                              <X 
                                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                onClick={() => removeBlockedWord(word)}
                              />
                            </Badge>
                          ))}
                          {blockedWords.length === 0 && (
                            <span className="text-xs text-muted-foreground">
                              Nenhum termo adicionado
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Mensagem de Redirecionamento (opcional)</Label>
                        <Textarea 
                          value={redirectMessage}
                          onChange={(e) => setRedirectMessage(e.target.value)}
                          placeholder="Mensagem exibida quando o filtro é acionado..."
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {type === 'business_rule' && (
                    <>
                      <div className="space-y-2">
                        <Label>Regra de Negócio</Label>
                        <Select value={customRule} onValueChange={setCustomRule}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma regra..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no_discount_promise">Não prometer descontos</SelectItem>
                            <SelectItem value="check_inventory_first">Verificar estoque antes</SelectItem>
                            <SelectItem value="financing_disclaimer">Aviso de financiamento</SelectItem>
                            <SelectItem value="business_hours">Horário de atendimento</SelectItem>
                            <SelectItem value="require_human_approval">Requer aprovação humana</SelectItem>
                            <SelectItem value="custom">Regra personalizada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Mensagem de Escalação (opcional)</Label>
                        <Textarea 
                          value={escalationMessage}
                          onChange={(e) => setEscalationMessage(e.target.value)}
                          placeholder="Mensagem ao escalar para humano..."
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {type === 'action_limit' && (
                    <>
                      <div className="space-y-2">
                        <Label>Tipo de Limite</Label>
                        <Select value={limitType} onValueChange={setLimitType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="api_calls">Chamadas de API por conversa</SelectItem>
                            <SelectItem value="response_time">Tempo de resposta (segundos)</SelectItem>
                            <SelectItem value="stale_turns">Turnos sem progresso</SelectItem>
                            <SelectItem value="response_tokens">Tokens por resposta</SelectItem>
                            <SelectItem value="messages_per_hour">Mensagens por hora</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Valor Máximo: {limitValue}</Label>
                        <Slider
                          value={[limitValue]}
                          onValueChange={([v]) => setLimitValue(v)}
                          min={1}
                          max={limitType === 'response_tokens' ? 2000 : 100}
                          step={limitType === 'response_tokens' ? 50 : 1}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1</span>
                          <span>{limitType === 'response_tokens' ? '2000' : '100'}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Mensagem de Escalação (opcional)</Label>
                        <Textarea 
                          value={escalationMessage}
                          onChange={(e) => setEscalationMessage(e.target.value)}
                          placeholder="Mensagem ao atingir limite..."
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {type === 'moderation' && (
                    <>
                      <div className="space-y-2">
                        <Label>Tipo de Moderação</Label>
                        <Select value={moderationType} onValueChange={setModerationTypes}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="offensive">Conteúdo ofensivo</SelectItem>
                            <SelectItem value="profanity">Linguagem inadequada</SelectItem>
                            <SelectItem value="pii_exposure">Exposição de dados pessoais</SelectItem>
                            <SelectItem value="hate_speech">Discurso de ódio</SelectItem>
                            <SelectItem value="violence">Conteúdo violento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Sensibilidade: {Math.round(threshold * 100)}%</Label>
                        <Slider
                          value={[threshold]}
                          onValueChange={([v]) => setThreshold(v)}
                          min={0.1}
                          max={1}
                          step={0.05}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Baixa (mais permissivo)</span>
                          <span>Alta (mais restritivo)</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !name.trim()}>
            {isLoading ? 'Salvando...' : guardrail ? 'Salvar Alterações' : 'Criar Guardrail'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
