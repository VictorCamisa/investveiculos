import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateAIAgentTool, useUpdateAIAgentTool } from '@/hooks/useAIAgents';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Save } from 'lucide-react';
import { AUTH_METHODS } from '@/types/ai-agents';
import type { AIAgentTool } from '@/types/ai-agents';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').regex(/^[a-z_][a-z0-9_]*$/, 'Use apenas letras minúsculas, números e underscores'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  endpoint_url: z.string().url('URL inválida').optional().or(z.literal('')),
  function_schema: z.string().min(1, 'Schema é obrigatório'),
  auth_method: z.string(),
  orchestration_rules: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ToolFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  tool?: AIAgentTool | null;
}

const defaultSchema = `{
  "type": "function",
  "function": {
    "name": "nome_da_funcao",
    "description": "Descrição do que a função faz",
    "parameters": {
      "type": "object",
      "properties": {
        "parametro1": {
          "type": "string",
          "description": "Descrição do parâmetro"
        }
      },
      "required": ["parametro1"]
    }
  }
}`;

export function ToolFormDialog({ open, onOpenChange, agentId, tool }: ToolFormDialogProps) {
  const createTool = useCreateAIAgentTool();
  const updateTool = useUpdateAIAgentTool();
  const isEditing = !!tool;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      endpoint_url: '',
      function_schema: defaultSchema,
      auth_method: 'none',
      orchestration_rules: '',
    },
  });

  useEffect(() => {
    if (tool) {
      form.reset({
        name: tool.name,
        description: tool.description,
        endpoint_url: tool.endpoint_url || '',
        function_schema: JSON.stringify(tool.function_schema, null, 2),
        auth_method: tool.auth_method,
        orchestration_rules: tool.orchestration_rules || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        endpoint_url: '',
        function_schema: defaultSchema,
        auth_method: 'none',
        orchestration_rules: '',
      });
    }
  }, [tool, form, open]);

  const onSubmit = async (data: FormData) => {
    try {
      const parsedSchema = JSON.parse(data.function_schema);
      
      const toolData = {
        agent_id: agentId,
        name: data.name,
        description: data.description,
        endpoint_url: data.endpoint_url || null,
        function_schema: parsedSchema,
        auth_method: data.auth_method,
        orchestration_rules: data.orchestration_rules || null,
      };

      if (isEditing) {
        await updateTool.mutateAsync({ id: tool.id, ...toolData });
      } else {
        await createTool.mutateAsync(toolData);
      }

      onOpenChange(false);
    } catch (e) {
      if (e instanceof SyntaxError) {
        form.setError('function_schema', { message: 'JSON inválido' });
      }
    }
  };

  const isPending = createTool.isPending || updateTool.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Ferramenta' : 'Nova Ferramenta'}</DialogTitle>
          <DialogDescription>
            Configure uma ferramenta que o agente poderá usar para realizar ações ou consultar dados.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Ferramenta</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="buscar_veiculo" 
                        className="font-mono"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Use snake_case (ex: criar_lead)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="auth_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Autenticação</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AUTH_METHODS.map(method => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Busca veículos disponíveis no estoque por marca, modelo ou faixa de preço"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Explique ao LLM quando e como usar esta ferramenta
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endpoint_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Endpoint</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://api.example.com/vehicles/search"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    URL da Edge Function ou API externa
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="function_schema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schema da Função (JSON)</FormLabel>
                  <FormControl>
                    <Textarea 
                      className="min-h-[200px] font-mono text-sm"
                      placeholder={defaultSchema}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Defina o schema da função seguindo o formato OpenAI Function Calling
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orchestration_rules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regra de Orquestração (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Usar quando o lead perguntar sobre disponibilidade ou preço de veículos"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Defina quando o agente deve usar esta ferramenta
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Salvar' : 'Criar Ferramenta'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
