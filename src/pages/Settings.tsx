import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Settings as SettingsIcon, Users, History } from 'lucide-react';
import { WhatsAppInstances } from '@/components/whatsapp/WhatsAppInstances';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserManagement } from '@/components/users';
import { ActivityLogsPage } from '@/components/users/ActivityLogsPage';
import { useAuth } from '@/contexts/AuthContext';

// ID do Matheus - único administrador
const ADMIN_USER_ID = '6c6e6c96-41d1-4ccc-a8d7-bbe1d1e62336';

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.id === ADMIN_USER_ID;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>

      <Tabs defaultValue={isAdmin ? 'usuarios' : 'whatsapp'} className="space-y-4">
        <TabsList>
          {isAdmin && (
            <>
              <TabsTrigger value="usuarios" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="historico" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="geral" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Geral
          </TabsTrigger>
        </TabsList>

        {isAdmin && (
          <>
            <TabsContent value="usuarios">
              <UserManagement />
            </TabsContent>

            <TabsContent value="historico">
              <ActivityLogsPage />
            </TabsContent>
          </>
        )}

        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integração WhatsApp</CardTitle>
              <CardDescription>
                Configure a conexão com o Evolution API para enviar e receber mensagens diretamente no CRM.
                O chat aparecerá na ficha de cada lead.
              </CardDescription>
            </CardHeader>
          </Card>
          <WhatsAppInstances />
        </TabsContent>

        <TabsContent value="geral">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configurações gerais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Em breve: configurações de notificações, horário de atendimento e mais.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
