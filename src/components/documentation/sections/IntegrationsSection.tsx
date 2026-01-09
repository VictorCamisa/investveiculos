import { SectionHeader } from "../ui/SectionHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, MessageSquare, Megaphone, Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface IntegrationsSectionProps {
  searchTerm: string;
}

const integrations = [
  {
    id: "evolution",
    name: "Evolution API (WhatsApp)",
    icon: MessageSquare,
    description: "Integração com WhatsApp Business via Evolution API para envio/recebimento de mensagens",
    status: "Configurado",
    secrets: ["EVOLUTION_API_URL", "EVOLUTION_API_KEY"],
    features: [
      "Múltiplas instâncias do WhatsApp",
      "Conexão via QR Code",
      "Envio de mensagens de texto",
      "Recebimento de mensagens via webhook",
      "Criação automática de leads",
      "Atribuição via Round Robin",
    ],
    webhook: {
      url: "/functions/v1/whatsapp-webhook",
      events: ["messages.upsert", "connection.update", "qrcode.updated"],
    },
    setup: [
      "1. Configurar EVOLUTION_API_URL com a URL da sua instância Evolution",
      "2. Configurar EVOLUTION_API_KEY com a chave de API",
      "3. Criar instância via painel do WhatsApp",
      "4. Escanear QR Code para conectar",
      "5. Configurar webhook na Evolution apontando para a edge function",
    ],
  },
  {
    id: "meta",
    name: "Meta Ads (Facebook/Instagram)",
    icon: Megaphone,
    description: "Sincronização de campanhas, conjuntos de anúncios, anúncios e métricas do Meta Business",
    status: "Configurado",
    secrets: ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID", "META_APP_ID", "META_APP_SECRET"],
    features: [
      "Sincronização de campanhas",
      "Sincronização de ad sets",
      "Sincronização de ads",
      "Métricas e insights diários",
      "Atribuição de leads a campanhas via UTM",
      "Dashboard de performance",
    ],
    setup: [
      "1. Criar app no Meta for Developers",
      "2. Obter token de acesso com permissões ads_read",
      "3. Configurar secrets no Supabase",
      "4. Executar sincronização manual ou agendar",
    ],
  },
  {
    id: "google",
    name: "Google Ads",
    icon: Search,
    description: "Sincronização de campanhas e métricas do Google Ads",
    status: "Configurado",
    secrets: [
      "GOOGLE_ADS_CLIENT_ID",
      "GOOGLE_ADS_CLIENT_SECRET",
      "GOOGLE_ADS_DEVELOPER_TOKEN",
      "GOOGLE_ADS_CUSTOMER_ID",
      "GOOGLE_ADS_REFRESH_TOKEN",
    ],
    features: [
      "Sincronização de campanhas",
      "Sincronização de ad groups",
      "Sincronização de ads",
      "Métricas de cliques, impressões, CPC, conversões",
      "Dashboard comparativo com Meta",
    ],
    setup: [
      "1. Criar projeto no Google Cloud Console",
      "2. Habilitar Google Ads API",
      "3. Criar credenciais OAuth 2.0",
      "4. Obter refresh token via fluxo OAuth",
      "5. Configurar todos os secrets",
    ],
  },
  {
    id: "supabase-storage",
    name: "Supabase Storage",
    icon: Link,
    description: "Armazenamento de imagens de veículos",
    status: "Ativo",
    secrets: [],
    features: [
      "Upload de fotos de veículos",
      "Bucket público para acesso às imagens",
      "Organização por veículo",
      "URLs públicas para exibição",
    ],
    bucket: {
      name: "vehicle-images",
      isPublic: true,
    },
  },
];

export const IntegrationsSection = ({ searchTerm }: IntegrationsSectionProps) => {
  const filtered = integrations.filter(
    (i) =>
      !searchTerm ||
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Integrações Externas"
        description="Serviços externos integrados ao sistema"
        icon={Link}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {integration.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{integration.description}</p>

                {integration.secrets.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Secrets:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {integration.secrets.map((s) => (
                        <Badge key={s} variant="secondary" className="font-mono text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium">Funcionalidades:</span>
                  <ul className="mt-1 space-y-1">
                    {integration.features.map((f, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        • {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Integração WhatsApp</CardTitle>
          <CardDescription>
            Como funciona a criação automática de leads via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-4">
              <Badge className="w-6 h-6 rounded-full flex items-center justify-center p-0">1</Badge>
              <span>Cliente envia mensagem para o WhatsApp da loja</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="w-6 h-6 rounded-full flex items-center justify-center p-0">2</Badge>
              <span>Evolution API recebe e envia para webhook</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="w-6 h-6 rounded-full flex items-center justify-center p-0">3</Badge>
              <span>Edge function processa a mensagem</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="w-6 h-6 rounded-full flex items-center justify-center p-0">4</Badge>
              <span>Verifica se lead existe pelo telefone</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="w-6 h-6 rounded-full flex items-center justify-center p-0">5</Badge>
              <span>Se não existe, cria lead e atribui via Round Robin</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="w-6 h-6 rounded-full flex items-center justify-center p-0">6</Badge>
              <span>Salva mensagem e notifica vendedor</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atribuição UTM para Campanhas</CardTitle>
          <CardDescription>
            Como leads são atribuídos às campanhas de marketing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Quando um lead entra pelo site com parâmetros UTM na URL, o sistema captura automaticamente:
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded bg-muted">
                <code className="text-xs">utm_source</code>
                <p className="text-xs text-muted-foreground mt-1">Origem (facebook, google, etc)</p>
              </div>
              <div className="p-3 rounded bg-muted">
                <code className="text-xs">utm_medium</code>
                <p className="text-xs text-muted-foreground mt-1">Meio (cpc, social, email)</p>
              </div>
              <div className="p-3 rounded bg-muted">
                <code className="text-xs">utm_campaign</code>
                <p className="text-xs text-muted-foreground mt-1">Nome da campanha</p>
              </div>
              <div className="p-3 rounded bg-muted">
                <code className="text-xs">utm_content</code>
                <p className="text-xs text-muted-foreground mt-1">Conteúdo/variação</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              Para leads do Meta Ads, também são capturados <code>meta_campaign_id</code>,
              <code>meta_adset_id</code> e <code>meta_ad_id</code> para atribuição precisa.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
