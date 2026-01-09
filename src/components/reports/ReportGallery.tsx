import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  BarChart3, 
  PieChart,
  Calendar,
  Award,
  ShoppingCart,
  Megaphone,
  FileText,
  Sparkles
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'vendas' | 'marketing' | 'crm' | 'financeiro';
  icon: React.ReactNode;
  prompt: string;
}

const templates: ReportTemplate[] = [
  // Vendas
  {
    id: 'vendas-semanal',
    name: 'Performance Semanal',
    description: 'Resumo de vendas da última semana com comparativo',
    category: 'vendas',
    icon: <TrendingUp className="h-5 w-5" />,
    prompt: 'Gere um relatório de performance de vendas da última semana, incluindo total de vendas, ticket médio, comparativo com semana anterior e destaque dos melhores vendedores.',
  },
  {
    id: 'ranking-vendedores',
    name: 'Ranking de Vendedores',
    description: 'Ranking completo com métricas de desempenho',
    category: 'vendas',
    icon: <Award className="h-5 w-5" />,
    prompt: 'Crie um ranking dos vendedores do mês atual com número de vendas, receita gerada, ticket médio, taxa de conversão e comissões.',
  },
  {
    id: 'analise-ticket',
    name: 'Análise de Ticket Médio',
    description: 'Evolução do ticket médio e fatores de influência',
    category: 'vendas',
    icon: <ShoppingCart className="h-5 w-5" />,
    prompt: 'Analise a evolução do ticket médio nos últimos 3 meses, identificando tendências, veículos mais vendidos e faixas de preço populares.',
  },
  // Marketing
  {
    id: 'roi-canais',
    name: 'ROI por Canal',
    description: 'Análise de retorno por canal de aquisição',
    category: 'marketing',
    icon: <Megaphone className="h-5 w-5" />,
    prompt: 'Gere um relatório de ROI por canal de marketing (Facebook, Instagram, Google, etc.) dos últimos 30 dias, incluindo investimento, leads gerados, CPL, vendas e ROAS.',
  },
  {
    id: 'funil-conversao',
    name: 'Funil de Conversão',
    description: 'Taxa de conversão em cada etapa do funil',
    category: 'marketing',
    icon: <Target className="h-5 w-5" />,
    prompt: 'Analise o funil de conversão completo: impressões → cliques → leads → qualificados → agendamentos → vendas. Identifique gargalos e sugestões de melhoria.',
  },
  {
    id: 'cpl-comparativo',
    name: 'CPL Comparativo',
    description: 'Comparativo de CPL entre períodos e campanhas',
    category: 'marketing',
    icon: <BarChart3 className="h-5 w-5" />,
    prompt: 'Compare o custo por lead (CPL) das últimas 4 semanas, identificando quais campanhas e canais estão mais eficientes.',
  },
  // CRM
  {
    id: 'leads-origem',
    name: 'Leads por Origem',
    description: 'Distribuição e qualidade por fonte',
    category: 'crm',
    icon: <PieChart className="h-5 w-5" />,
    prompt: 'Crie um relatório detalhado de leads por origem nos últimos 30 dias, incluindo quantidade, taxa de qualificação, tempo de resposta e taxa de conversão por fonte.',
  },
  {
    id: 'tempo-resposta',
    name: 'Tempo de Resposta',
    description: 'Análise de SLA de primeiro contato',
    category: 'crm',
    icon: <Calendar className="h-5 w-5" />,
    prompt: 'Analise o tempo médio de primeira resposta aos leads por vendedor e por origem, identificando leads sem resposta e impacto na conversão.',
  },
  {
    id: 'taxa-conversao',
    name: 'Taxa de Conversão',
    description: 'Análise completa de conversão de leads',
    category: 'crm',
    icon: <Users className="h-5 w-5" />,
    prompt: 'Gere um relatório de taxa de conversão de leads em vendas, segmentado por origem, vendedor e período, com insights sobre os fatores de sucesso.',
  },
  // Financeiro
  {
    id: 'dre-resumido',
    name: 'DRE Resumido',
    description: 'Demonstrativo de resultado simplificado',
    category: 'financeiro',
    icon: <FileText className="h-5 w-5" />,
    prompt: 'Crie um DRE resumido do mês atual com receita bruta, custos de veículos, custos de venda, despesas operacionais e lucro líquido.',
  },
  {
    id: 'lucratividade-veiculo',
    name: 'Lucratividade por Veículo',
    description: 'Margem de lucro por veículo vendido',
    category: 'financeiro',
    icon: <DollarSign className="h-5 w-5" />,
    prompt: 'Analise a lucratividade por veículo vendido no último mês, incluindo preço de compra, custos, preço de venda e margem de lucro.',
  },
];

const categoryLabels = {
  vendas: { label: 'Vendas', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  marketing: { label: 'Marketing', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  crm: { label: 'CRM', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  financeiro: { label: 'Financeiro', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
};

interface ReportGalleryProps {
  onSelectTemplate: (templateId: string) => void;
}

export function ReportGallery({ onSelectTemplate }: ReportGalleryProps) {
  const categories = ['vendas', 'marketing', 'crm', 'financeiro'] as const;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <p className="text-muted-foreground">
          Escolha um template para gerar um relatório automaticamente com IA
        </p>
      </div>

      {categories.map(category => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge variant="outline" className={categoryLabels[category].color}>
              {categoryLabels[category].label}
            </Badge>
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.filter(t => t.category === category).map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {template.icon}
                    </div>
                  </div>
                  <CardTitle className="text-base mt-3">{template.name}</CardTitle>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={() => onSelectTemplate(template.id)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { templates };
