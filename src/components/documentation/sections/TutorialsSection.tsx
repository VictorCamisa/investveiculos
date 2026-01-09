import { SectionHeader } from "../ui/SectionHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ChevronRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface TutorialsSectionProps {
  searchTerm: string;
}

const tutorials = [
  {
    id: "create-user",
    title: "Como criar um novo usuário",
    difficulty: "Fácil",
    steps: [
      "Acesse Configurações no menu lateral",
      "Clique na aba 'Usuários'",
      "Clique no botão 'Novo Usuário'",
      "Preencha: Nome completo, E-mail, Senha",
      "Selecione a Role (Gerente, Vendedor ou Marketing)",
      "Clique em 'Criar Usuário'",
      "O usuário receberá acesso imediato ao sistema",
    ],
    tips: [
      "Senhas devem ter no mínimo 6 caracteres",
      "E-mails devem ser únicos no sistema",
      "Apenas gerentes podem criar novos usuários",
    ],
  },
  {
    id: "round-robin",
    title: "Como configurar o Round Robin",
    difficulty: "Médio",
    steps: [
      "Acesse Configurações > Usuários",
      "Identifique os vendedores que participarão da distribuição",
      "Para cada vendedor, configure na aba Round Robin:",
      "- Ativar/Desativar participação",
      "- Limite máximo de leads por dia (opcional)",
      "- Prioridade (maior número = maior prioridade)",
      "Leads serão distribuídos automaticamente ao entrar via WhatsApp ou formulário",
    ],
    tips: [
      "Vendedores inativos não recebem leads",
      "O limite diário é resetado à meia-noite",
      "A distribuição considera quem recebeu menos leads primeiro",
    ],
  },
  {
    id: "whatsapp-setup",
    title: "Como configurar o WhatsApp",
    difficulty: "Médio",
    steps: [
      "Acesse WhatsApp > Instâncias no menu lateral",
      "Clique em 'Nova Instância'",
      "Digite um nome identificador (ex: vendas-principal)",
      "Após criar, clique em 'Gerar QR Code'",
      "Escaneie o QR Code com o WhatsApp do celular",
      "Aguarde a conexão ser estabelecida",
      "Configure o webhook na Evolution API apontando para:",
      "https://[seu-projeto].supabase.co/functions/v1/whatsapp-webhook",
    ],
    tips: [
      "Use um número de telefone dedicado para o WhatsApp Business",
      "Mantenha o celular conectado à internet",
      "Se desconectar, gere um novo QR Code",
    ],
  },
  {
    id: "commission-rules",
    title: "Como criar regras de comissão",
    difficulty: "Avançado",
    steps: [
      "Acesse Comissões > Regras no menu lateral",
      "Clique em 'Nova Regra'",
      "Defina o nome e descrição da regra",
      "Escolha o tipo de comissão:",
      "- Valor Fixo: valor definido por venda",
      "- % sobre Venda: percentual do valor de venda",
      "- % sobre Lucro: percentual do lucro bruto",
      "- Escalonado: faixas com valores diferentes",
      "Configure condições (opcional):",
      "- Valor mínimo/máximo do veículo",
      "- Margem de lucro mínima",
      "- Dias em estoque",
      "- Categorias de veículos",
      "Defina a prioridade (maior = aplicada primeiro)",
      "Ative a regra e salve",
    ],
    tips: [
      "Regras com maior prioridade são verificadas primeiro",
      "Apenas uma regra é aplicada por venda",
      "Teste com o simulador antes de ativar",
    ],
  },
  {
    id: "manage-leads",
    title: "Como gerenciar leads no CRM",
    difficulty: "Fácil",
    steps: [
      "Acesse CRM no menu lateral",
      "Na visão de Pipeline, veja leads por status",
      "Clique em um lead para ver detalhes",
      "Para registrar interação:",
      "- Clique em 'Nova Interação'",
      "- Selecione o tipo (ligação, WhatsApp, visita, etc)",
      "- Adicione descrição",
      "- Opcional: agende follow-up",
      "Para mover de status:",
      "- Arraste o card ou use o menu de ações",
      "Para criar negociação:",
      "- Clique em 'Iniciar Negociação'",
      "- Selecione veículo de interesse",
      "- Defina valor estimado",
    ],
    tips: [
      "Leads novos devem ser contactados em até 5 minutos",
      "Qualifique leads como Hot, Warm ou Cold",
      "Use o indicador de tempo sem contato",
    ],
  },
  {
    id: "register-sale",
    title: "Como registrar uma venda",
    difficulty: "Médio",
    steps: [
      "Acesse Vendas > Vendas no menu lateral",
      "Clique em 'Nova Venda'",
      "Selecione o veículo (apenas disponíveis)",
      "Selecione ou cadastre o cliente",
      "Defina o preço de venda",
      "Adicione formas de pagamento:",
      "- À vista, Financiamento, Consórcio, Troca",
      "- Pode combinar múltiplas formas",
      "Para financiamento, preencha:",
      "- Banco, Parcelas, Taxa, Entrada",
      "Adicione custos da venda (documentação, transferência)",
      "Vincule o lead/negociação se houver",
      "Salve como 'Pendente' para aprovação ou 'Concluída'",
    ],
    tips: [
      "Vendas pendentes precisam de aprovação do gerente",
      "A comissão é calculada automaticamente ao concluir",
      "O veículo fica indisponível ao concluir a venda",
    ],
  },
  {
    id: "meta-ads",
    title: "Como configurar Meta Ads",
    difficulty: "Avançado",
    steps: [
      "Acesse developers.facebook.com",
      "Crie um novo app do tipo Business",
      "Adicione o produto Marketing API",
      "Gere um token de acesso com permissões:",
      "- ads_read, ads_management",
      "No Supabase, configure os secrets:",
      "- META_ACCESS_TOKEN",
      "- META_AD_ACCOUNT_ID (formato: act_XXXXXXXXX)",
      "- META_APP_ID",
      "- META_APP_SECRET",
      "Acesse Marketing no sistema",
      "Clique em 'Sincronizar Meta Ads'",
      "Aguarde a sincronização completar",
    ],
    tips: [
      "Tokens expiram - renove periodicamente",
      "Use tokens de longa duração quando possível",
      "Sincronize diariamente para métricas atualizadas",
    ],
  },
  {
    id: "sale-simulator",
    title: "Como usar o simulador de venda",
    difficulty: "Fácil",
    steps: [
      "Acesse Estoque e selecione um veículo",
      "Na página de detalhes, clique em 'Simular Venda'",
      "Ou acesse Comissões > Simulador",
      "Informe o preço de venda desejado",
      "O sistema calcula automaticamente:",
      "- Lucro bruto (venda - compra - custos)",
      "- Margem de lucro percentual",
      "- Comissão estimada do vendedor",
      "- Lucro líquido final",
      "Ajuste o preço para ver diferentes cenários",
    ],
    tips: [
      "Considere todos os custos do veículo",
      "A comissão é baseada na regra ativa de maior prioridade",
      "Use para negociar preço com o cliente",
    ],
  },
];

export const TutorialsSection = ({ searchTerm }: TutorialsSectionProps) => {
  const filtered = tutorials.filter(
    (t) =>
      !searchTerm ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.steps.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil":
        return "bg-green-500";
      case "Médio":
        return "bg-yellow-500";
      case "Avançado":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Tutoriais de Uso"
        description="Guias passo a passo para as principais funcionalidades"
        icon={GraduationCap}
      />

      <Accordion type="single" collapsible className="space-y-4">
        {filtered.map((tutorial) => (
          <AccordionItem key={tutorial.id} value={tutorial.id} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Badge className={getDifficultyColor(tutorial.difficulty)}>
                  {tutorial.difficulty}
                </Badge>
                <span className="font-semibold">{tutorial.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div>
                <h4 className="font-medium mb-3">Passo a passo:</h4>
                <div className="space-y-2">
                  {tutorial.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      {step.startsWith("-") ? (
                        <span className="text-muted-foreground ml-8">•</span>
                      ) : (
                        <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center p-0 shrink-0">
                          {idx + 1 - tutorial.steps.slice(0, idx).filter(s => s.startsWith("-")).length}
                        </Badge>
                      )}
                      <span className={`text-sm ${step.startsWith("-") ? "text-muted-foreground" : ""}`}>
                        {step.replace(/^-\s*/, "")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {tutorial.tips.length > 0 && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-sm mb-2">💡 Dicas:</h4>
                  <ul className="space-y-1">
                    {tutorial.tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
