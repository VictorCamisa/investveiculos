import { useState } from 'react';
import { Plus, Target, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSalespersonGoals, useCreateSalespersonGoal } from '@/hooks/useCommissionsComplete';
import { useAuth } from '@/contexts/AuthContext';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formSchema = z.object({
  user_id: z.string().min(1, 'Selecione um vendedor'),
  period_start: z.string().min(1, 'Data inicial obrigatória'),
  period_end: z.string().min(1, 'Data final obrigatória'),
  target_sales: z.coerce.number().min(1, 'Meta de vendas obrigatória'),
  target_revenue: z.coerce.number().min(1, 'Meta de faturamento obrigatória'),
  target_profit: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

function useSalespeople() {
  return useQuery({
    queryKey: ['salespeople-for-goals'],
    queryFn: async () => {
      // Get only users with vendedor role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'vendedor');
      
      if (!roles?.length) return [];
      
      const userIds = (roles as { user_id: string }[]).map(r => r.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
        .eq('is_active', true)
        .order('full_name');
      
      return profiles || [];
    },
  });
}

export function CommissionGoalsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const { data: goals, isLoading } = useSalespersonGoals();
  const { data: salespeople } = useSalespeople();
  const createGoal = useCreateSalespersonGoal();
  const { role } = useAuth();

  const isManager = role === 'gerente';
  const today = new Date();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: '',
      period_start: format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd'),
      period_end: format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd'),
      target_sales: 5,
      target_revenue: 100000,
      target_profit: 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    await createGoal.mutateAsync({
      user_id: data.user_id,
      period_start: data.period_start,
      period_end: data.period_end,
      target_sales: data.target_sales,
      target_revenue: data.target_revenue,
      target_profit: data.target_profit || 0,
    });
    setFormOpen(false);
    form.reset();
  };

  const activeGoals = goals?.filter(g => {
    try {
      return isWithinInterval(today, {
        start: parseISO(g.period_start),
        end: parseISO(g.period_end),
      });
    } catch {
      return false;
    }
  }) || [];

  const pastGoals = goals?.filter(g => {
    try {
      return parseISO(g.period_end) < today;
    } catch {
      return false;
    }
  }) || [];

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Metas de Vendedores
          </h2>
          <p className="text-sm text-muted-foreground">Defina e acompanhe metas da equipe</p>
        </div>
        {isManager && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova Meta
          </Button>
        )}
      </div>

      {/* Active Goals */}
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          Metas Ativas
        </h3>
        
        {activeGoals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma meta ativa no momento
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((goal) => {
              const salesProgress = goal.target_sales > 0 ? (goal.current_sales / goal.target_sales) * 100 : 0;
              const revenueProgress = Number(goal.target_revenue) > 0 ? (Number(goal.current_revenue) / Number(goal.target_revenue)) * 100 : 0;
              const isAchieved = salesProgress >= 100 && revenueProgress >= 100;
              
              return (
                <Card key={goal.id} className={isAchieved ? 'border-green-500/50 bg-green-500/5' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{goal.user?.full_name || 'Vendedor'}</CardTitle>
                      {isAchieved && <Badge className="bg-green-500">Meta Batida! 🎉</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(goal.period_start), 'dd/MM', { locale: ptBR })} - {format(parseISO(goal.period_end), 'dd/MM', { locale: ptBR })}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Vendas</span>
                        <span className="font-medium">{goal.current_sales}/{goal.target_sales}</span>
                      </div>
                      <Progress value={Math.min(salesProgress, 100)} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {salesProgress >= 100 ? '✓ Meta atingida!' : `Faltam ${goal.target_sales - goal.current_sales} vendas`}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Faturamento</span>
                        <span className="font-medium">{formatCurrency(Number(goal.current_revenue))}</span>
                      </div>
                      <Progress value={Math.min(revenueProgress, 100)} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Meta: {formatCurrency(Number(goal.target_revenue))}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Goals */}
      {pastGoals.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4 text-muted-foreground">Metas Anteriores</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pastGoals.slice(0, 8).map((goal) => {
              const salesProgress = goal.target_sales > 0 ? (goal.current_sales / goal.target_sales) * 100 : 0;
              const achieved = salesProgress >= 100;
              
              return (
                <Card key={goal.id} className="opacity-75">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{goal.user?.full_name || 'Vendedor'}</p>
                      <Badge variant={achieved ? 'default' : 'secondary'}>
                        {achieved ? '✓' : `${salesProgress.toFixed(0)}%`}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(goal.period_start), 'MMM/yyyy', { locale: ptBR })}
                    </p>
                    <p className="text-sm">
                      {goal.current_sales}/{goal.target_sales} vendas
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* New Goal Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Meta</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendedor *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o vendedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {salespeople?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.full_name || 'Sem nome'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="period_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="period_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="target_sales"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta de Vendas *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="target_revenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Faturamento *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createGoal.isPending}>
                  {createGoal.isPending ? 'Criando...' : 'Criar Meta'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
