import { SectionHeader } from "../ui/SectionHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface HooksSectionProps {
  searchTerm: string;
}

const hooks = [
  // UI Hooks
  { name: "use-mobile", category: "UI", description: "Detecta se está em dispositivo móvel", returns: "boolean" },
  { name: "use-toast", category: "UI", description: "Exibe notificações toast", returns: "{ toast, dismiss }" },
  { name: "use-debounced-dimensions", category: "UI", description: "Dimensões debounced de elemento", returns: "{ width, height }" },

  // Auth & Permissions
  { name: "usePermissions", category: "Auth", description: "Verifica permissões do usuário logado", returns: "{ hasPermission, isManager, isMaster, isLoading }" },
  
  // CRM Hooks
  { name: "useLeads", category: "CRM", description: "CRUD de leads", returns: "{ leads, createLead, updateLead, deleteLead }" },
  { name: "useLeadInteractions", category: "CRM", description: "Interações com leads", returns: "{ interactions, createInteraction }" },
  { name: "useNegotiations", category: "CRM", description: "CRUD de negociações", returns: "{ negotiations, createNegotiation, updateNegotiation }" },
  { name: "useCustomers", category: "CRM", description: "CRUD de clientes", returns: "{ customers, createCustomer, updateCustomer }" },
  { name: "useFollowUpFlows", category: "CRM", description: "Fluxos de follow-up", returns: "{ flows, createFlow, updateFlow, deleteFlow }" },
  { name: "useLossRecoveryRules", category: "CRM", description: "Regras de recuperação de perdas", returns: "{ rules, createRule, updateRule }" },
  { name: "useRoundRobin", category: "CRM", description: "Configuração Round Robin", returns: "{ config, updateConfig, getNextSalesperson }" },
  
  // Vehicles
  { name: "useVehicles", category: "Estoque", description: "CRUD de veículos", returns: "{ vehicles, createVehicle, updateVehicle, deleteVehicle }" },
  { name: "usePublicVehicles", category: "Estoque", description: "Veículos para site público", returns: "{ vehicles, isLoading }" },
  { name: "useVehicleInterestAlerts", category: "Estoque", description: "Alertas de interesse em veículos", returns: "{ alerts, createAlert }" },
  
  // Sales
  { name: "useSales", category: "Vendas", description: "CRUD de vendas", returns: "{ sales, createSale, updateSale }" },
  { name: "useSalesTeamMetrics", category: "Vendas", description: "Métricas da equipe de vendas", returns: "{ metrics, ranking }" },
  { name: "useSalesperson", category: "Vendas", description: "Dados de um vendedor específico", returns: "{ salesperson, sales, metrics }" },
  
  // Financial
  { name: "useFinancial", category: "Financeiro", description: "Dashboard financeiro", returns: "{ summary, transactions }" },
  { name: "useFinancialTransactions", category: "Financeiro", description: "CRUD de transações", returns: "{ transactions, createTransaction }" },
  { name: "useFinancialSync", category: "Financeiro", description: "Sincronização financeira", returns: "{ sync, isSyncing }" },
  
  // Commissions
  { name: "useCommissions", category: "Comissões", description: "Comissões do usuário", returns: "{ commissions, totals }" },
  { name: "useCommissionsComplete", category: "Comissões", description: "Sistema completo de comissões", returns: "{ rules, goals, ranking, commissions }" },
  
  // Marketing
  { name: "useMarketing", category: "Marketing", description: "Campanhas e métricas", returns: "{ campaigns, metrics }" },
  { name: "useMarketingCockpit", category: "Marketing", description: "Dashboard de marketing", returns: "{ kpis, trends }" },
  { name: "useMetaAds", category: "Marketing", description: "Dados do Meta Ads", returns: "{ campaigns, adsets, ads, insights, sync }" },
  { name: "useGoogleAds", category: "Marketing", description: "Dados do Google Ads", returns: "{ campaigns, adGroups, ads, insights, sync }" },
  { name: "useCompleteLeadOrigin", category: "Marketing", description: "Análise de origem de leads", returns: "{ origins, byChannel, bySource }" },
  { name: "useAutomotiveKPIs", category: "Marketing", description: "KPIs específicos automotivos", returns: "{ kpis, benchmarks }" },
  
  // WhatsApp
  { name: "useWhatsApp", category: "WhatsApp", description: "Instâncias e mensagens WhatsApp", returns: "{ instances, messages, sendMessage }" },
  
  // Users & System
  { name: "useUsers", category: "Sistema", description: "Gestão de usuários", returns: "{ users, createUser, updateUser }" },
  { name: "useNotifications", category: "Sistema", description: "Notificações do usuário", returns: "{ notifications, markAsRead }" },
];

const categories = [...new Set(hooks.map((h) => h.category))];

export const HooksSection = ({ searchTerm }: HooksSectionProps) => {
  const filtered = hooks.filter(
    (h) =>
      !searchTerm ||
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedHooks = categories.map((cat) => ({
    category: cat,
    hooks: filtered.filter((h) => h.category === cat),
  })).filter((g) => g.hooks.length > 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Hooks React"
        description="Custom hooks disponíveis para uso nos componentes"
        icon={Code2}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">{hooks.length}</CardTitle>
          <CardDescription>Hooks customizados</CardDescription>
        </CardHeader>
      </Card>

      {groupedHooks.map((group) => (
        <Card key={group.category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default">{group.category}</Badge>
              <span className="text-base font-normal text-muted-foreground">
                {group.hooks.length} hooks
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Hook</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[300px]">Retorno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.hooks.map((hook) => (
                  <TableRow key={hook.name}>
                    <TableCell className="font-mono text-sm">{hook.name}</TableCell>
                    <TableCell className="text-muted-foreground">{hook.description}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{hook.returns}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Padrão de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
{`// Exemplo de uso do hook useLeads
import { useLeads } from "@/hooks/useLeads";

const MyComponent = () => {
  const { 
    leads, 
    isLoading, 
    createLead, 
    updateLead,
    deleteLead 
  } = useLeads();

  if (isLoading) return <Loading />;

  return (
    <div>
      {leads.map(lead => (
        <LeadCard 
          key={lead.id} 
          lead={lead}
          onUpdate={updateLead}
        />
      ))}
    </div>
  );
};`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
