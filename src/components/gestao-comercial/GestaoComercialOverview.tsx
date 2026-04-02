import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Wallet, Target, RefreshCw, TrendingUp, Trophy } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const cards = [
  {
    title: 'Equipe',
    description: 'Gerencie vendedores, metas individuais e desempenho',
    icon: Users,
    href: '/gestao-comercial/equipe',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'Round Robin',
    description: 'Configure a distribuição automática de leads entre vendedores',
    icon: RefreshCw,
    href: '/gestao-comercial/round-robin',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    title: 'Comissões',
    description: 'Regras, histórico e simulador de comissões',
    icon: Wallet,
    href: '/gestao-comercial/comissoes',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    title: 'Metas',
    description: 'Defina e acompanhe metas de vendas por vendedor',
    icon: Target,
    href: '/gestao-comercial/metas',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    title: 'Ranking',
    description: 'Veja o ranking de performance da equipe comercial',
    icon: Trophy,
    href: '/gestao-comercial/ranking',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    title: 'Métricas',
    description: 'KPIs e análises de desempenho comercial',
    icon: TrendingUp,
    href: '/gestao-comercial/metricas',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
];

export function GestaoComercialOverview() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestão Comercial</h2>
        <p className="text-muted-foreground mt-1">
          Central de controle da operação comercial: equipe, distribuição de leads, comissões e metas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <NavLink key={card.href} to={card.href}>
            <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <CardTitle className="text-base group-hover:text-primary transition-colors">
                    {card.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
