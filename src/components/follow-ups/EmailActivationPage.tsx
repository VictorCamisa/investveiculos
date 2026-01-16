import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Mail, 
  Send, 
  Users, 
  Calendar, 
  Gift, 
  Car, 
  Clock,
  Target,
  Sparkles,
  Plus,
  Search,
  Play,
  Pause,
  BarChart3,
  CheckCircle2,
  Eye,
  MousePointer
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Segmentation types (same as WhatsApp)
const SEGMENTATION_TYPES = [
  { 
    id: 'purchase_anniversary', 
    label: 'Aniversário de Compra', 
    icon: Car,
    description: 'Leads que compraram há exatamente 1 ano',
    color: 'text-blue-500 bg-blue-500/10'
  },
  { 
    id: 'birthday', 
    label: 'Aniversário Pessoal', 
    icon: Gift,
    description: 'Leads que fazem aniversário hoje ou nos próximos dias',
    color: 'text-pink-500 bg-pink-500/10'
  },
  { 
    id: 'inactive_30d', 
    label: 'Inativos 30+ dias', 
    icon: Clock,
    description: 'Leads sem interação há mais de 30 dias',
    color: 'text-orange-500 bg-orange-500/10'
  },
  { 
    id: 'inactive_60d', 
    label: 'Inativos 60+ dias', 
    icon: Clock,
    description: 'Leads sem interação há mais de 60 dias',
    color: 'text-red-500 bg-red-500/10'
  },
  { 
    id: 'hot_leads', 
    label: 'Leads Quentes', 
    icon: Target,
    description: 'Leads com alta pontuação de qualificação (Q2/Q3)',
    color: 'text-green-500 bg-green-500/10'
  },
  { 
    id: 'newsletter', 
    label: 'Newsletter', 
    icon: Mail,
    description: 'Todos os leads com email cadastrado',
    color: 'text-purple-500 bg-purple-500/10'
  },
];

// Mock email campaigns
const MOCK_CAMPAIGNS = [
  {
    id: '1',
    name: 'Newsletter - Novidades Janeiro',
    segmentation: 'newsletter',
    status: 'completed',
    subject: '🚗 Confira as novidades do mês na Invest Veículos!',
    targetCount: 523,
    sentCount: 518,
    openRate: 34,
    clickRate: 12,
    createdAt: '2024-01-20',
  },
  {
    id: '2',
    name: 'Aniversário de Compra',
    segmentation: 'purchase_anniversary',
    status: 'active',
    subject: '🎉 Parabéns pelo 1 ano do seu veículo!',
    targetCount: 45,
    sentCount: 32,
    openRate: 52,
    clickRate: 18,
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    name: 'Reativação Leads Inativos',
    segmentation: 'inactive_60d',
    status: 'draft',
    subject: 'Sentimos sua falta! Confira nossas ofertas especiais',
    targetCount: 156,
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: '2024-01-25',
  },
];

export function EmailActivationPage() {
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegmentation, setSelectedSegmentation] = useState<string>('');
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    segmentation: '',
    subject: '',
    content: '',
    scheduleType: 'immediate',
  });

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
  const avgOpenRate = campaigns.filter(c => c.sentCount > 0).length > 0 
    ? Math.round(campaigns.filter(c => c.sentCount > 0).reduce((acc, c) => acc + c.openRate, 0) / campaigns.filter(c => c.sentCount > 0).length)
    : 0;

  const getSegmentationInfo = (id: string) => SEGMENTATION_TYPES.find(s => s.id === id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Ativa</Badge>;
      case 'completed':
        return <Badge variant="secondary">Concluída</Badge>;
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'paused':
        return <Badge variant="destructive">Pausada</Badge>;
      default:
        return null;
    }
  };

  const handleCreateCampaign = () => {
    setIsCreateOpen(false);
    setNewCampaign({
      name: '',
      segmentation: '',
      subject: '',
      content: '',
      scheduleType: 'immediate',
    });
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Ativação via Email</CardTitle>
              <CardDescription>
                Crie campanhas de email marketing com segmentações inteligentes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Campanhas</p>
              <p className="text-2xl font-bold">{campaigns.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Play className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ativas</p>
              <p className="text-2xl font-bold">{activeCampaigns}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Emails Enviados</p>
              <p className="text-2xl font-bold">{totalSent}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa Abertura</p>
              <p className="text-2xl font-bold">{avgOpenRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segmentation Options */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Segmentações Disponíveis
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {SEGMENTATION_TYPES.map((seg) => (
            <Card 
              key={seg.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedSegmentation === seg.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => {
                setSelectedSegmentation(seg.id);
                setNewCampaign(prev => ({ ...prev, segmentation: seg.id }));
                setIsCreateOpen(true);
              }}
            >
              <CardContent className="p-3 text-center">
                <div className={`h-10 w-10 rounded-lg ${seg.color} flex items-center justify-center mx-auto mb-2`}>
                  <seg.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium">{seg.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campanhas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <Card className="p-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Nenhuma campanha encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira campanha de email marketing
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Campanha
            </Button>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => {
            const segInfo = getSegmentationInfo(campaign.segmentation);
            return (
              <Card key={campaign.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                        {segInfo && (
                          <Badge variant="outline" className="gap-1">
                            <segInfo.icon className="h-3 w-3" />
                            {segInfo.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>Assunto:</strong> {campaign.subject}
                      </p>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{campaign.targetCount} destinatários</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>{campaign.sentCount} enviados</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-blue-500" />
                          <span>{campaign.openRate}% abertura</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MousePointer className="h-4 w-4 text-purple-500" />
                          <span>{campaign.clickRate}% cliques</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(campaign.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {campaign.status === 'draft' && (
                        <Button size="sm" className="gap-1">
                          <Send className="h-4 w-4" />
                          Enviar
                        </Button>
                      )}
                      {campaign.status === 'active' && (
                        <Button variant="outline" size="sm">
                          <Pause className="h-4 w-4 mr-1" />
                          Pausar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Campanha de Email</DialogTitle>
            <DialogDescription>
              Configure uma nova campanha de email marketing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Campanha</Label>
              <Input
                placeholder="Ex: Newsletter Janeiro"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Segmentação</Label>
              <Select 
                value={newCampaign.segmentation}
                onValueChange={(value) => setNewCampaign(prev => ({ ...prev, segmentation: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a segmentação" />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENTATION_TYPES.map((seg) => (
                    <SelectItem key={seg.id} value={seg.id}>
                      <div className="flex items-center gap-2">
                        <seg.icon className="h-4 w-4" />
                        {seg.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assunto do Email</Label>
              <Input
                placeholder="Ex: 🚗 Confira nossas novidades!"
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                placeholder="Digite o conteúdo do email... Use {{nome}}, {{veiculo}} para personalização"
                value={newCampaign.content}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Agendamento</Label>
              <Select 
                value={newCampaign.scheduleType}
                onValueChange={(value) => setNewCampaign(prev => ({ ...prev, scheduleType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Enviar imediatamente</SelectItem>
                  <SelectItem value="scheduled">Agendar para data específica</SelectItem>
                  <SelectItem value="draft">Salvar como rascunho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCampaign} className="gap-2">
              <Send className="h-4 w-4" />
              Criar Campanha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
