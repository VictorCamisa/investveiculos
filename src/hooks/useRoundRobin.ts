import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_URL = 'https://rugbunseyblzapwzevqh.supabase.co';

export interface RoundRobinConfig {
  id: string;
  user_id: string;
  is_active: boolean;
  priority: number;
  daily_limit: number | null;
  current_count: number;
  last_assigned_at: string | null;
  total_leads_assigned: number;
  updated_at: string;
  salesperson?: {
    id: string;
    full_name: string | null;
  };
}

export interface LeadAssignment {
  id: string;
  lead_id: string;
  user_id: string;
  assigned_at: string;
  lead?: {
    id: string;
    name: string;
    phone: string;
    source: string;
    status: string;
  };
  salesperson?: {
    id: string;
    full_name: string | null;
  };
}

export interface SalespersonWithRole {
  id: string;
  full_name: string | null;
  role: string | null;
  is_in_round_robin: boolean;
  round_robin_config?: RoundRobinConfig;
}

export function useRoundRobinConfig() {
  return useQuery({
    queryKey: ['round-robin-config'],
    queryFn: async (): Promise<RoundRobinConfig[]> => {
      const { data, error } = await (supabase as any)
        .from('round_robin_config')
        .select(`
          *,
          salesperson:profiles!user_id(id, full_name)
        `)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useSalespeopleWithRoles() {
  return useQuery({
    queryKey: ['salespeople-with-roles'],
    queryFn: async (): Promise<SalespersonWithRole[]> => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await (supabase as any)
        .from('profiles')
        .select('id, full_name');

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await (supabase as any)
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get round robin configs
      const { data: rrConfigs, error: rrError } = await (supabase as any)
        .from('round_robin_config')
        .select('*');

      if (rrError) throw rrError;

      // Combine data
      return (profiles || []).map((p: any) => {
        const userRole = (roles || []).find((r: any) => r.user_id === p.id);
        const rrConfig = (rrConfigs || []).find((r: any) => r.user_id === p.id);
        
        return {
          id: p.id,
          full_name: p.full_name,
          role: userRole?.role || null,
          is_in_round_robin: !!rrConfig,
          round_robin_config: rrConfig,
        };
      });
    },
  });
}

export function useLeadAssignments() {
  return useQuery({
    queryKey: ['lead-assignments'],
    queryFn: async (): Promise<LeadAssignment[]> => {
      const { data, error } = await (supabase as any)
        .from('lead_assignments')
        .select(`
          *,
          lead:leads(id, name, phone, source, status),
          salesperson:profiles!user_id(id, full_name)
        `)
        .order('assigned_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddToRoundRobin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { 
      salesperson_id: string; 
      priority?: number; 
      daily_limit?: number | null 
    }) => {
      const { data, error } = await (supabase as any)
        .from('round_robin_config')
        .insert({
          user_id: input.salesperson_id,
          priority: input.priority || 0,
          daily_limit: input.daily_limit,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['round-robin-config'] });
      queryClient.invalidateQueries({ queryKey: ['salespeople-with-roles'] });
      toast({ title: 'Vendedor adicionado ao Round Robin!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateRoundRobinConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { 
      id: string; 
      is_active?: boolean;
      priority?: number; 
      daily_limit?: number | null 
    }) => {
      const { id, ...updates } = input;
      const { data, error } = await (supabase as any)
        .from('round_robin_config')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['round-robin-config'] });
      queryClient.invalidateQueries({ queryKey: ['salespeople-with-roles'] });
      toast({ title: 'Configuração atualizada!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRemoveFromRoundRobin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('round_robin_config')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['round-robin-config'] });
      queryClient.invalidateQueries({ queryKey: ['salespeople-with-roles'] });
      toast({ title: 'Vendedor removido do Round Robin!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });
}

export function useAssignSalespersonRole() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { user_id: string; role: 'vendedor' | 'gerente' | 'marketing' }) => {
      // First check if user already has a role
      const { data: existingRole } = await (supabase as any)
        .from('user_roles')
        .select('id')
        .eq('user_id', input.user_id)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await (supabase as any)
          .from('user_roles')
          .update({ role: input.role })
          .eq('user_id', input.user_id);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await (supabase as any)
          .from('user_roles')
          .insert({ user_id: input.user_id, role: input.role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespeople-with-roles'] });
      toast({ title: 'Função atribuída com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atribuir função', description: error.message, variant: 'destructive' });
    },
  });
}

const SUPABASE_FUNCTIONS_URL = 'https://rugbunseyblzapwzevqh.supabase.co/functions/v1';

// Helper function to send WhatsApp notification to salesperson
export async function notifySalespersonAboutLead(salespersonId: string, leadId: string, leadName: string | null) {
  try {
    // Get salesperson phone from profiles
    const { data: salesperson } = await (supabase as any)
      .from('profiles')
      .select('phone, full_name')
      .eq('id', salespersonId)
      .single();

    // Create in-app notification
    await (supabase as any)
      .from('notifications')
      .insert({
        user_id: salespersonId,
        type: 'new_lead',
        title: 'Novo Lead Atribuído!',
        message: `Você recebeu um novo lead: ${leadName || 'Cliente'}. Acesse o CRM para mais detalhes.`,
        link: `/crm`,
        read: false,
      });

    // Send WhatsApp notification if phone is available
    if (salesperson?.phone) {
      const { data: { session } } = await supabase.auth.getSession();
      
      const message = `🚗 *Novo Lead Atribuído!*\n\nOlá ${salesperson.full_name || 'Vendedor'}!\n\nVocê recebeu um novo lead: *${leadName || 'Cliente'}*\n\nAcesse o CRM para ver os detalhes e iniciar o atendimento.`;
      
      try {
        const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/whatsapp-send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({
            phone: salesperson.phone,
            message,
            userId: salespersonId,
          }),
        });

        if (!response.ok) {
          console.error('Erro ao enviar WhatsApp:', await response.text());
        } else {
          console.log('Notificação WhatsApp enviada com sucesso');
        }
      } catch (whatsappError) {
        console.error('Erro ao enviar WhatsApp:', whatsappError);
      }
    } else {
      console.log('Vendedor sem telefone cadastrado, notificação WhatsApp não enviada');
    }
  } catch (err) {
    console.error('Erro ao notificar vendedor:', err);
  }
}

export function useManualLeadAssignment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { lead_id: string; salesperson_id: string }) => {
      // Get lead info first
      const { data: leadData } = await (supabase as any)
        .from('leads')
        .select('name')
        .eq('id', input.lead_id)
        .single();

      // Update the lead's assigned_to
      const { error: leadError } = await (supabase as any)
        .from('leads')
        .update({ assigned_to: input.salesperson_id })
        .eq('id', input.lead_id);

      if (leadError) throw leadError;

      // Create assignment record
      const { error: assignError } = await (supabase as any)
        .from('lead_assignments')
        .insert({
          lead_id: input.lead_id,
          user_id: input.salesperson_id,
        });

      if (assignError) throw assignError;

      // Send notification to the salesperson
      await notifySalespersonAboutLead(input.salesperson_id, input.lead_id, leadData?.name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'Lead atribuído com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atribuir lead', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCreateUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { 
      email: string; 
      password: string; 
      full_name: string; 
      role: 'vendedor' | 'gerente' | 'marketing';
      add_to_round_robin?: boolean;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Você precisa estar logado');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          full_name: input.full_name,
          role: input.role,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      // If should add to round robin
      if (input.add_to_round_robin && input.role === 'vendedor' && data.user?.id) {
        await (supabase as any)
          .from('round_robin_config')
          .insert({ user_id: data.user.id, is_active: true });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespeople-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['round-robin-config'] });
      toast({ title: 'Usuário criado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar usuário', description: error.message, variant: 'destructive' });
    },
  });
}
