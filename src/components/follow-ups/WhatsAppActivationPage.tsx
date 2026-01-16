import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  MessageCircle, 
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
  Filter,
  Play,
  Pause,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Segmentation types
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
    id: 'lost_negotiations', 
    label: 'Negociações Perdidas', 
    icon: Users,
    description: 'Leads com negociações que foram perdidas',
    color: 'text-yellow-500 bg-yellow-500/10'
  },
];

// Mock campaigns data
const MOCK_CAMPAIGNS = [
  {
    id: '1',
    name: 'Aniversário de Compra - Janeiro',
    segmentation: 'purchase_anniversary',
    status: 'active',
    message: 'Olá {{nome}}! 🎉 Faz exatamente 1 ano que você adquiriu seu {{veiculo}} conosco! Como está seu carro? Gostaríamos de saber se está tudo bem e se podemos ajudá-lo em algo.',
    targetCount: 45,
    sentCount: 32,
    responseRate: 28,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Feliz Aniversário',
    segmentation: 'birthday',
    status: 'active',
    message: 'Olá {{nome}}! 🎂 A equipe Invest Veículos deseja um feliz aniversário! Que seu dia seja repleto de alegrias. Se precisar de alguma coisa, estamos à disposição!',
    targetCount: 12,
    sentCount: 12,
    responseRate: 41,
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'Reativação Inativos 60d',
    segmentation: 'inactive_60d',
    status: 'paused',
    message: 'Olá {{nome}}! Sentimos sua falta! 😊 Temos novidades incríveis em nosso estoque. Que tal dar uma olhada? Posso te enviar algumas opções!',
    targetCount: 156,
    sentCount: 89,
    responseRate: 15,
    createdAt: '2024-01-05',
  },
];

export function WhatsAppActivationPage() {
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegmentation, setSelectedSegmentation] = useState<string>('');
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    segmentation: '',
    message: '',
    scheduleType: 'immediate',
    scheduleDate: '',
  });

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
  const avgResponseRate = campaigns.length > 0 
    ? Math.round(campaigns.reduce((acc, c) => acc + c.responseRate, 0) / campaigns.length)
    : 0;

  const getSegmentationInfo = (id: string) => SEGMENTATION_TYPES.find(s => s.id === id);

  const handleCreateCampaign = () => {
    // In real implementation, this would create the campaign in the database
    setIsCreateOpen(false);
    setNewCampaign({
      name: '',
      segmentation: '',
      message: '',
      scheduleType: 'immediate',
      scheduleDate: '',
    });
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => 
      c.id === id 
        ? { ...c, status: c.status === 'active' ? 'paused' : 'active' }
        : c
    ));
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Ativação via WhatsApp</CardTitle>
              <CardDescription>
                Dispare mensagens segmentadas para grupos específicos de leads
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
              <MessageCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Msgs Enviadas</p>
              <p className="text-2xl font-bold">{totalSent}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa Resposta</p>
              <p className="text-2xl font-bold">{avgResponseRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segmentation Options */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Segmentações Inteligentes Disponíveis
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
            <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Nenhuma campanha encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira campanha de ativação via WhatsApp
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
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status === 'active' ? 'Ativa' : 'Pausada'}
                        </Badge>
                        {segInfo && (
                          <Badge variant="outline" className="gap-1">
                            <segInfo.icon className="h-3 w-3" />
                            {segInfo.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {campaign.message}
                      </p>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{campaign.targetCount} destinatários</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>{campaign.sentCount} enviadas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4 text-blue-500" />
                          <span>{campaign.responseRate}% resposta</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(campaign.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCampaignStatus(campaign.id)}
                      >
                        {campaign.status === 'active' ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
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
            <DialogTitle>Nova Campanha WhatsApp</DialogTitle>
            <DialogDescription>
              Configure uma nova campanha de ativação via WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Campanha</Label>
              <Input
                placeholder="Ex: Aniversário de Compra - Janeiro"
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
              {newCampaign.segmentation && (
                <p className="text-xs text-muted-foreground">
                  {getSegmentationInfo(newCampaign.segmentation)?.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Digite a mensagem... Use {{nome}}, {{veiculo}}, {{vendedor}} para personalização"
                value={newCampaign.message}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Variáveis disponíveis: {'{{nome}}'}, {'{{veiculo}}'}, {'{{vendedor}}'}, {'{{empresa}}'}
              </p>
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
                  <SelectItem value="recurring">Envio recorrente (diário)</SelectItem>
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
