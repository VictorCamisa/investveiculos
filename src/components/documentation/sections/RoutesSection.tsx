import { SectionHeader } from "../ui/SectionHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, Globe, Lock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RoutesSectionProps {
  searchTerm: string;
}

const publicRoutes = [
  { path: "/", component: "Home", description: "Página inicial do site público" },
  { path: "/veiculos", component: "PublicEstoque", description: "Catálogo público de veículos" },
  { path: "/veiculos/:id", component: "PublicVehicleDetails", description: "Detalhes de veículo público" },
  { path: "/sobre", component: "Sobre", description: "Página sobre a empresa" },
  { path: "/contato", component: "Contato", description: "Página de contato" },
  { path: "/auth", component: "Auth", description: "Login do sistema" },
];

const protectedRoutes = [
  { path: "/dashboard", component: "Dashboard", module: "-", description: "Dashboard principal" },
  { path: "/crm", component: "CRMHome", module: "crm", description: "Pipeline de leads e negociações" },
  { path: "/crm/leads", component: "Leads", module: "crm", description: "Lista de leads" },
  { path: "/crm/follow-ups", component: "FollowUps", module: "crm", description: "Follow-ups pendentes" },
  { path: "/crm/perdas", component: "LostNegotiations", module: "crm", description: "Negociações perdidas" },
  { path: "/crm/analytics", component: "CRMAnalytics", module: "crm", description: "Analytics do CRM" },
  { path: "/estoque", component: "Inventory", module: "estoque", description: "Lista de veículos" },
  { path: "/estoque/:id", component: "VehicleDetails", module: "estoque", description: "Detalhes do veículo" },
  { path: "/estoque/importar", component: "ImportVehicles", module: "estoque", description: "Importação em lote" },
  { path: "/vendas", component: "SalesDashboard", module: "vendas", description: "Dashboard de vendas" },
  { path: "/vendas/aprovacoes", component: "SalesApprovals", module: "vendas", description: "Aprovações pendentes" },
  { path: "/vendas/vendas", component: "SalesListPage", module: "vendas", description: "Lista de vendas" },
  { path: "/vendas/equipe", component: "SalesTeamView", module: "vendas", description: "Visão da equipe" },
  { path: "/vendas/equipe/:id", component: "SalespersonDetail", module: "vendas", description: "Detalhes do vendedor" },
  { path: "/vendas/lucro", component: "SalesProfitPage", module: "vendas", description: "Relatório de lucro" },
  { path: "/vendas/metricas", component: "SalesMetricsPage", module: "vendas", description: "Métricas avançadas" },
  { path: "/financeiro", component: "FinancialDashboard", module: "financeiro", description: "Dashboard financeiro" },
  { path: "/financeiro/lancamentos", component: "TransactionsPage", module: "financeiro", description: "Lançamentos" },
  { path: "/financeiro/dre", component: "DREPage", module: "financeiro", description: "DRE" },
  { path: "/financeiro/fluxo-caixa", component: "CashFlowPage", module: "financeiro", description: "Fluxo de caixa" },
  { path: "/financeiro/rentabilidade", component: "ProfitabilityPage", module: "financeiro", description: "Rentabilidade" },
  { path: "/financeiro/comissoes", component: "FinancialCommissionsPage", module: "financeiro", description: "Comissões a pagar" },
  { path: "/financeiro/alertas", component: "AlertsPage", module: "financeiro", description: "Alertas financeiros" },
  { path: "/marketing", component: "MarketingLayout", module: "marketing", description: "Módulo de marketing" },
  { path: "/relatorios", component: "Reports", module: "marketing", description: "Relatórios com IA" },
  { path: "/comissoes", component: "CommissionDashboard", module: "comissoes", description: "Dashboard comissões" },
  { path: "/comissoes/regras", component: "CommissionRulesPage", module: "comissoes", description: "Regras de comissão" },
  { path: "/comissoes/metas", component: "CommissionGoalsPage", module: "comissoes", description: "Metas de vendedores" },
  { path: "/comissoes/ranking", component: "CommissionRankingPage", module: "comissoes", description: "Ranking" },
  { path: "/comissoes/historico", component: "CommissionHistoryPage", module: "comissoes", description: "Histórico" },
  { path: "/comissoes/simulador", component: "CommissionSimulatorPage", module: "comissoes", description: "Simulador" },
  { path: "/configuracoes", component: "Settings", module: "configuracoes", description: "Configurações gerais" },
  { path: "/whatsapp", component: "WhatsAppConversations", module: "configuracoes", description: "Conversas WhatsApp" },
  { path: "/whatsapp/painel", component: "WhatsAppManagerDashboard", module: "configuracoes", description: "Painel gerencial" },
  { path: "/whatsapp/contatos", component: "WhatsAppContacts", module: "configuracoes", description: "Contatos" },
  { path: "/whatsapp/templates", component: "WhatsAppTemplates", module: "configuracoes", description: "Templates" },
  { path: "/whatsapp/instancias", component: "WhatsAppInstances", module: "configuracoes", description: "Instâncias" },
  { path: "/whatsapp/config", component: "WhatsAppConfig", module: "configuracoes", description: "Configurações" },
];

export const RoutesSection = ({ searchTerm }: RoutesSectionProps) => {
  const filteredPublic = publicRoutes.filter(
    (r) =>
      !searchTerm ||
      r.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProtected = protectedRoutes.filter(
    (r) =>
      !searchTerm ||
      r.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Rotas da Aplicação"
        description="Mapeamento completo de URLs e componentes"
        icon={Route}
      />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{publicRoutes.length}</CardTitle>
            <CardDescription>Rotas Públicas</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{protectedRoutes.length}</CardTitle>
            <CardDescription>Rotas Protegidas</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Rotas Públicas
          </CardTitle>
          <CardDescription>Acessíveis sem autenticação</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Rota</TableHead>
                <TableHead className="w-[180px]">Componente</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPublic.map((route) => (
                <TableRow key={route.path}>
                  <TableCell className="font-mono text-sm">{route.path}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{route.component}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{route.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Rotas Protegidas
          </CardTitle>
          <CardDescription>Requerem autenticação e permissões</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Rota</TableHead>
                <TableHead className="w-[100px]">Módulo</TableHead>
                <TableHead className="w-[200px]">Componente</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProtected.map((route) => (
                <TableRow key={route.path}>
                  <TableCell className="font-mono text-sm">{route.path}</TableCell>
                  <TableCell>
                    {route.module !== "-" ? (
                      <Badge variant="secondary">{route.module}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{route.component}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{route.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
