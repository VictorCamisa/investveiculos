import { SectionHeader } from "../ui/SectionHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Server, Code2, Database, Palette, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OverviewSectionProps {
  searchTerm: string;
}

export const OverviewSection = ({ searchTerm }: OverviewSectionProps) => {
  const techStack = [
    { name: "React 18", description: "Biblioteca de UI", icon: Code2 },
    { name: "Vite", description: "Build tool", icon: Server },
    { name: "Supabase", description: "Backend as a Service", icon: Database },
    { name: "Tailwind CSS", description: "Estilização", icon: Palette },
    { name: "TypeScript", description: "Tipagem estática", icon: Code2 },
    { name: "Shadcn/UI", description: "Componentes", icon: LayoutDashboard },
  ];

  const systemStats = [
    { label: "Tabelas no Banco", value: "54" },
    { label: "Views", value: "3" },
    { label: "Funções SQL", value: "16" },
    { label: "Edge Functions", value: "11" },
    { label: "Hooks React", value: "31" },
    { label: "Componentes", value: "100+" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Visão Geral do Sistema"
        description="Sistema completo de gestão para loja de veículos - Matheus Veículos"
        icon={LayoutDashboard}
      />

      <Card>
        <CardHeader>
          <CardTitle>Sobre o Sistema</CardTitle>
          <CardDescription>
            Sistema ERP completo para gestão de loja de veículos seminovos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O sistema Matheus Veículos é uma solução completa para gestão de lojas de veículos,
            incluindo CRM, gestão de estoque, vendas, financeiro, marketing, comissões e integração
            com WhatsApp para atendimento automatizado.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {systemStats.map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stack Tecnológica</CardTitle>
          <CardDescription>Tecnologias utilizadas no desenvolvimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {techStack.map((tech) => {
              const Icon = tech.icon;
              return (
                <div
                  key={tech.name}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{tech.name}</div>
                    <div className="text-xs text-muted-foreground">{tech.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Principais Funcionalidades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <Badge>CRM</Badge>
              <span className="text-sm">Gestão completa de leads, negociações, follow-ups e recuperação de perdas</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge>Estoque</Badge>
              <span className="text-sm">Controle de veículos, custos, fotos, simulação de venda e DRE por veículo</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge>Vendas</Badge>
              <span className="text-sm">Dashboard de vendas, aprovações, equipe, métricas e relatório de lucro</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge>Financeiro</Badge>
              <span className="text-sm">DRE, fluxo de caixa, lançamentos, rentabilidade e alertas financeiros</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge>Marketing</Badge>
              <span className="text-sm">Integração Meta Ads e Google Ads, campanhas, origem de leads e relatórios</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge>Comissões</Badge>
              <span className="text-sm">Regras flexíveis, metas, ranking de vendedores, histórico e simulador</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge>WhatsApp</Badge>
              <span className="text-sm">Instâncias múltiplas, conversas, templates, webhook e criação automática de leads</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Arquitetura de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Row Level Security (RLS)</strong> em todas as tabelas</li>
            <li>• <strong>Sistema de Roles</strong>: Gerente, Vendedor, Marketing</li>
            <li>• <strong>Permissões granulares</strong> por módulo (view, create, edit, delete, manage)</li>
            <li>• <strong>Usuário Master</strong> com acesso total</li>
            <li>• <strong>Logs de atividade</strong> para auditoria</li>
            <li>• <strong>Edge Functions</strong> com SECURITY DEFINER para operações sensíveis</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
