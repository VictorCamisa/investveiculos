import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { leadSourceLabels, leadStatusLabels, qualificationStatusLabels } from '@/types/crm';
import type { Lead, LeadSource, LeadStatus, QualificationStatus } from '@/types/crm';
import { useMetaCampaigns } from '@/hooks/useMetaAds';
import { useUsersWithRoles } from '@/hooks/useUsers';
import { Megaphone, User } from 'lucide-react';

const leadFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone inválido').max(20),
  source: z.enum(['website', 'indicacao', 'facebook', 'instagram', 'google_ads', 'olx', 'webmotors', 'outros']),
  status: z.enum(['novo', 'contato_inicial', 'qualificado', 'proposta', 'negociacao', 'convertido', 'perdido']).optional(),
  notes: z.string().max(1000).optional(),
  vehicle_interest: z.string().max(200).optional(),
  meta_campaign_id: z.string().optional(),
  qualification_status: z.enum(['nao_qualificado', 'qualificado', 'desqualificado']).optional(),
  qualification_reason: z.string().max(500).optional(),
  assigned_to: z.string().min(1, 'Selecione um vendedor'),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: LeadFormValues) => void;
  isLoading?: boolean;
}

export function LeadForm({ lead, onSubmit, isLoading }: LeadFormProps) {
  const { data: campaigns = [] } = useMetaCampaigns();
  const { data: users = [] } = useUsersWithRoles();
  
  // Filter to only show users with vendedor or gerente role
  const salespeople = users.filter(u => 
    u.roles.includes('vendedor') || u.roles.includes('gerente')
  );
  
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: lead?.name || '',
      email: lead?.email || '',
      phone: lead?.phone || '',
      source: lead?.source || 'outros',
      status: lead?.status || 'novo',
      notes: lead?.notes || '',
      vehicle_interest: lead?.vehicle_interest || '',
      meta_campaign_id: lead?.meta_campaign_id || '',
      qualification_status: lead?.qualification_status || 'nao_qualificado',
      qualification_reason: lead?.qualification_reason || '',
      assigned_to: lead?.assigned_to || '',
    },
  });

  const watchSource = form.watch('source');
  const showCampaignField = ['facebook', 'instagram', 'google_ads'].includes(watchSource);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Nome do lead" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone *</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="email@exemplo.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origem *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(leadSourceLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assigned_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Vendedor Responsável *
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o vendedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {salespeople.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email || 'Sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {lead && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(leadStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {showCampaignField && (
          <FormField
            control={form.control}
            name="meta_campaign_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Campanha de Origem
                </FormLabel>
                <Select 
                  onValueChange={(val) => field.onChange(val === "none" ? "" : val)} 
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a campanha (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {lead && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <FormField
              control={form.control}
              name="qualification_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualificação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'nao_qualificado'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(qualificationStatusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qualification_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da Qualificação</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Tem entrada, crédito aprovado..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="vehicle_interest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interesse em veículo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Honda Civic 2020, SUV até 80k" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Anotações sobre o lead..." 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Salvando...' : lead ? 'Atualizar Lead' : 'Criar Lead'}
        </Button>
      </form>
    </Form>
  );
}
