import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Search, Loader2, Users, MessageSquare, Clock, CheckCircle2, XCircle, Zap, Filter, Smartphone, History, Shuffle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lead { id: string; name: string | null; phone: string | null; source: string; status: string; created_at: string; }
interface BroadcastResult { phone: string; name: string; leadId: string; success: boolean; error?: string; }
interface BroadcastLog { id: string; campaign_name: string | null; message_template: string; total_leads: number; success_count: number; fail_count: number; created_at: string; }

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  return d || phone;
}

function getRandomDelay(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export default function SmartBroadcast() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedInstance, setSelectedInstance] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendResults, setSendResults] = useState<BroadcastResult[]>([]);
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(8);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const { data: instances = [] } = useQuery({
    queryKey: ['whatsapp-instances-broadcast'],
    queryFn: async () => {
      const { data, error } = await supabase.from('whatsapp_instances').select('id, name, status').eq('status', 'connected');
      if (error) throw error;
      return data as { id: string; name: string; status: string }[];
    },
  });

  useEffect(() => { if (instances.length > 0 && !selectedInstance) setSelectedInstance(instances[0].id); }, [instances, selectedInstance]);

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-for-broadcast'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('id, name, phone, source, status, created_at').not('phone', 'is', null).neq('phone', '').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: broadcastHistory = [] } = useQuery({
    queryKey: ['broadcast-history'],
    queryFn: async () => {
      const { data, error } = await supabase.from('broadcast_logs' as any).select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return (data || []) as unknown as BroadcastLog[];
    },
  });

  const uniqueSources = [...new Set(leads.map(l => l.source))];
  const uniqueStatuses = [...new Set(leads.map(l => l.status))];
  const filteredLeads = leads.filter(l => {
    const s = !searchFilter || l.name?.toLowerCase().includes(searchFilter.toLowerCase()) || l.phone?.includes(searchFilter);
    const so = sourceFilter === 'all' || l.source === sourceFilter;
    const st = statusFilter === 'all' || l.status === statusFilter;
    return s && so && st;
  });

  const toggleLead = (id: string) => setSelectedLeads(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => selectedLeads.size === filteredLeads.length ? setSelectedLeads(new Set()) : setSelectedLeads(new Set(filteredLeads.map(l => l.id)));

  const templates = [
    { name: 'Reativação', message: 'Olá {nome}! 👋\n\nPassando para saber se ainda tem interesse em veículos. Temos novidades incríveis!\n\nPosso te ajudar?' },
    { name: 'Promoção', message: 'Olá {nome}! 🚗✨\n\nTemos condições especiais esta semana! Entrada facilitada e taxas reduzidas.\n\nQuer saber mais?' },
    { name: 'Follow-up', message: 'Oi {nome}, tudo bem?\n\nVi que você demonstrou interesse anteriormente. Ainda está procurando um veículo?\n\nEstou à disposição!' },
  ];

  const handleSendBroadcast = async () => {
    if (!selectedInstance) { toast.error('Selecione uma instância WhatsApp'); return; }
    if (selectedLeads.size === 0) { toast.error('Selecione pelo menos um lead'); return; }
    if (!message.trim()) { toast.error('Digite uma mensagem'); return; }

    setIsSending(true); setSendProgress(0); setSendResults([]);
    const leadsToSend = filteredLeads.filter(l => selectedLeads.has(l.id));
    const results: BroadcastResult[] = [];

    for (let i = 0; i < leadsToSend.length; i++) {
      const lead = leadsToSend[i];
      const personalizedMsg = message.replace(/\{nome\}/g, lead.name || 'Cliente');
      try {
        const { error } = await supabase.functions.invoke('whatsapp-send', {
          body: { phone: lead.phone, message: personalizedMsg, instanceId: selectedInstance, leadId: lead.id, userId: user?.id },
        });
        if (error) throw error;
        results.push({ phone: lead.phone || '', name: lead.name || '', leadId: lead.id, success: true });
      } catch (err) {
        results.push({ phone: lead.phone || '', name: lead.name || '', leadId: lead.id, success: false, error: err instanceof Error ? err.message : 'Erro' });
      }
      setSendProgress(((i + 1) / leadsToSend.length) * 100);
      setSendResults([...results]);
      if (i < leadsToSend.length - 1) await new Promise(r => setTimeout(r, getRandomDelay(minDelay * 1000, maxDelay * 1000)));
    }

    const sc = results.filter(r => r.success).length;
    const fc = results.filter(r => !r.success).length;
    await (supabase as any).from('broadcast_logs').insert({
      campaign_name: campaignName || `Disparo ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      message_template: message, total_leads: results.length, success_count: sc, fail_count: fc,
      instance_id: selectedInstance, created_by: user?.id,
    });

    setIsSending(false);
    queryClient.invalidateQueries({ queryKey: ['broadcast-history'] });
    if (sc > 0) toast.success(`${sc} mensagens enviadas!`);
    if (fc > 0) toast.error(`${fc} falhas`);
  };

  const successCount = sendResults.filter(r => r.success).length;
  const failCount = sendResults.filter(r => !r.success).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Zap className="h-6 w-6 text-primary" /> Disparador Inteligente</h1>
          <p className="text-muted-foreground">Envie mensagens personalizadas para múltiplos leads via WhatsApp</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowHistoryModal(true)} className="gap-2"><History className="h-4 w-4" /> Histórico</Button>
          <Select value={selectedInstance} onValueChange={setSelectedInstance}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Instância WhatsApp" /></SelectTrigger>
            <SelectContent>
              {instances.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{leads.length}</div><p className="text-sm text-muted-foreground">Leads c/ Telefone</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{selectedLeads.size}</div><p className="text-sm text-muted-foreground">Selecionados</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-emerald-600">{successCount}</div><p className="text-sm text-muted-foreground">Enviados</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-destructive">{failCount}</div><p className="text-sm text-muted-foreground">Falhas</p></CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Selecionar Leads</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="pl-9" />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Origem" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Checkbox checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0} onCheckedChange={toggleAll} />
              <span className="text-sm text-muted-foreground">Selecionar todos ({filteredLeads.length})</span>
            </div>
            <ScrollArea className="flex-1 max-h-[400px]">
              <div className="space-y-2">
                {filteredLeads.map(lead => (
                  <div key={lead.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer" onClick={() => toggleLead(lead.id)}>
                    <Checkbox checked={selectedLeads.has(lead.id)} />
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{(lead.name || '?')[0]}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lead.name || 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground">{formatPhone(lead.phone || '')}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{lead.source}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Mensagem</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <Input placeholder="Nome da campanha (opcional)" value={campaignName} onChange={e => setCampaignName(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <Button key={t.name} variant="outline" size="sm" onClick={() => setMessage(t.message)}>{t.name}</Button>
              ))}
            </div>
            <Textarea placeholder="Digite sua mensagem... Use {nome} para personalizar" value={message} onChange={e => setMessage(e.target.value)} className="flex-1 min-h-[150px]" />
            <div className="flex gap-4">
              <div className="space-y-1 flex-1">
                <label className="text-xs text-muted-foreground">Delay mín (s)</label>
                <Input type="number" value={minDelay} onChange={e => setMinDelay(parseInt(e.target.value) || 1)} />
              </div>
              <div className="space-y-1 flex-1">
                <label className="text-xs text-muted-foreground">Delay máx (s)</label>
                <Input type="number" value={maxDelay} onChange={e => setMaxDelay(parseInt(e.target.value) || 5)} />
              </div>
            </div>
            {isSending && <Progress value={sendProgress} className="h-2" />}
            <Button size="lg" onClick={handleSendBroadcast} disabled={isSending || selectedLeads.size === 0 || !message.trim() || !selectedInstance} className="w-full gap-2">
              {isSending ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando... {Math.round(sendProgress)}%</> : <><Send className="h-4 w-4" /> Enviar para {selectedLeads.size} leads</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      {sendResults.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Resultados do Envio</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {sendResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-accent/30">
                    {r.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                    <span className="text-sm font-medium">{r.name}</span>
                    <span className="text-xs text-muted-foreground">{formatPhone(r.phone)}</span>
                    {r.error && <span className="text-xs text-destructive">{r.error}</span>}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Histórico de Disparos</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[500px]">
            {broadcastHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum disparo realizado</p>
            ) : (
              <div className="space-y-3">
                {broadcastHistory.map(log => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{log.campaign_name || 'Sem nome'}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-600">{log.success_count} ✓</Badge>
                        {log.fail_count > 0 && <Badge variant="destructive">{log.fail_count} ✗</Badge>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
