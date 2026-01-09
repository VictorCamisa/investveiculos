import { Calendar, DollarSign, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSaleCommissions } from '@/hooks/useCommissionsComplete';
import { commissionStatusLabels, commissionStatusColors } from '@/types/commissions';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function CommissionCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: commissions, isLoading } = useSaleCommissions();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getCommissionsForDay = (day: Date) => {
    return commissions?.filter(c => {
      if (c.payment_due_date) {
        return isSameDay(parseISO(c.payment_due_date), day);
      }
      if (c.paid_at) {
        return isSameDay(parseISO(c.paid_at), day);
      }
      return false;
    }) || [];
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calculate totals by status for the month
  const monthCommissions = commissions?.filter(c => {
    const date = c.payment_due_date ? parseISO(c.payment_due_date) : c.paid_at ? parseISO(c.paid_at) : null;
    if (!date) return false;
    return date >= monthStart && date <= monthEnd;
  }) || [];

  const pendingTotal = monthCommissions.filter(c => c.status === 'pending' || c.status === 'approved').reduce((sum, c) => sum + c.final_amount, 0);
  const paidTotal = monthCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.final_amount, 0);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Calendário de Pagamentos
          </h2>
          <p className="text-sm text-muted-foreground">Visualize e gerencie datas de pagamento</p>
        </div>
      </div>

      {/* Month Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">A Pagar</span>
            </div>
            <p className="text-2xl font-bold text-yellow-500">{formatCurrency(pendingTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Pagas no Mês</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(paidTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total do Mês</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(pendingTotal + paidTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle>
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] p-1" />
            ))}

            {/* Days of the month */}
            {days.map(day => {
              const dayCommissions = getCommissionsForDay(day);
              const hasCommissions = dayCommissions.length > 0;
              const isToday = isSameDay(day, new Date());
              const total = dayCommissions.reduce((sum, c) => sum + c.final_amount, 0);

              return (
                <div
                  key={day.toString()}
                  className={`min-h-[80px] p-1 rounded-lg border transition-colors ${
                    isToday ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'
                  } ${hasCommissions ? 'bg-muted/30' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  {hasCommissions && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-green-500">{formatCurrency(total)}</p>
                      {dayCommissions.slice(0, 2).map(c => (
                        <div key={c.id} className="text-xs truncate">
                          <Badge className={`${commissionStatusColors[c.status]} text-[10px] px-1 py-0`}>
                            {c.user?.full_name?.split(' ')[0] || 'V'}
                          </Badge>
                        </div>
                      ))}
                      {dayCommissions.length > 2 && (
                        <p className="text-[10px] text-muted-foreground">+{dayCommissions.length - 2}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {commissions
              ?.filter(c => (c.status === 'approved' || c.status === 'pending') && c.payment_due_date)
              .sort((a, b) => new Date(a.payment_due_date!).getTime() - new Date(b.payment_due_date!).getTime())
              .slice(0, 5)
              .map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{c.user?.full_name || 'Vendedor'}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.payment_due_date && format(parseISO(c.payment_due_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(c.final_amount)}</p>
                    <Badge className={commissionStatusColors[c.status]}>
                      {commissionStatusLabels[c.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            {commissions?.filter(c => (c.status === 'approved' || c.status === 'pending') && c.payment_due_date).length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhum pagamento agendado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
