import { SectionHeader } from "../ui/SectionHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Key, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PermissionsSectionProps {
  searchTerm: string;
}

const roles = [
  {
    name: "gerente",
    label: "Gerente",
    description: "Acesso total a todos os módulos do sistema",
    color: "bg-red-500",
    permissions: "Todas as permissões em todos os módulos",
  },
  {
    name: "vendedor",
    label: "Vendedor",
    description: "Acesso focado em CRM, vendas e comissões próprias",
    color: "bg-blue-500",
    permissions: "CRM (criar/editar), Vendas (ver), Estoque (ver), Comissões (ver próprias)",
  },
  {
    name: "marketing",
    label: "Marketing",
    description: "Acesso ao CRM e módulo de marketing",
    color: "bg-green-500",
    permissions: "CRM (criar/editar), Marketing (gerenciar), Vendas (ver)",
  },
];

const modules = [
  "crm",
  "vendas",
  "estoque",
  "financeiro",
  "marketing",
  "comissoes",
  "configuracoes",
  "usuarios",
];

const permissionTypes = ["view", "create", "edit", "delete", "manage"];

const permissionMatrix = {
  gerente: {
    crm: ["view", "create", "edit", "delete", "manage"],
    vendas: ["view", "create", "edit", "delete", "manage"],
    estoque: ["view", "create", "edit", "delete", "manage"],
    financeiro: ["view", "create", "edit", "delete", "manage"],
    marketing: ["view", "create", "edit", "delete", "manage"],
    comissoes: ["view", "create", "edit", "delete", "manage"],
    configuracoes: ["view", "create", "edit", "delete", "manage"],
    usuarios: ["view", "create", "edit", "delete", "manage"],
  },
  vendedor: {
    crm: ["view", "create", "edit"],
    vendas: ["view"],
    estoque: ["view"],
    financeiro: [],
    marketing: [],
    comissoes: ["view"],
    configuracoes: [],
    usuarios: [],
  },
  marketing: {
    crm: ["view", "create", "edit"],
    vendas: ["view"],
    estoque: ["view"],
    financeiro: [],
    marketing: ["view", "create", "edit", "manage"],
    comissoes: [],
    configuracoes: [],
    usuarios: [],
  },
};

export const PermissionsSection = ({ searchTerm }: PermissionsSectionProps) => {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Sistema de Permissões"
        description="Controle de acesso baseado em roles e permissões granulares"
        icon={Shield}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Roles (Funções)
          </CardTitle>
          <CardDescription>
            Cada usuário pode ter uma ou mais roles atribuídas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {roles.map((role) => (
            <div key={role.name} className="flex items-start gap-4 p-4 rounded-lg border">
              <div className={`h-10 w-10 rounded-full ${role.color} flex items-center justify-center text-white font-bold`}>
                {role.label.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{role.label}</h4>
                  <Badge variant="outline" className="font-mono text-xs">
                    {role.name}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Permissões:</strong> {role.permissions}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Tipos de Permissão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {permissionTypes.map((perm) => (
              <div key={perm} className="flex items-center gap-2">
                <Badge variant="outline">{perm}</Badge>
                <span className="text-sm text-muted-foreground">
                  {perm === "view" && "Visualizar dados"}
                  {perm === "create" && "Criar novos registros"}
                  {perm === "edit" && "Editar registros existentes"}
                  {perm === "delete" && "Excluir registros"}
                  {perm === "manage" && "Gerenciar configurações"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matriz de Permissões</CardTitle>
          <CardDescription>
            Permissões padrão por role em cada módulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Módulo</TableHead>
                  {roles.map((role) => (
                    <TableHead key={role.name} className="text-center">
                      {role.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module}>
                    <TableCell className="font-mono text-sm">{module}</TableCell>
                    {roles.map((role) => {
                      const perms = permissionMatrix[role.name as keyof typeof permissionMatrix][module as keyof (typeof permissionMatrix)["gerente"]];
                      return (
                        <TableCell key={role.name} className="text-center">
                          {perms.length === 5 ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Total
                            </Badge>
                          ) : perms.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {perms.map((p) => (
                                <Badge key={p} variant="secondary" className="text-xs">
                                  {p}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuário Master</CardTitle>
          <CardDescription>
            Acesso especial sem restrições
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm">
              <strong>Usuário Master</strong> é um flag especial (<code>is_master = true</code>) no perfil que concede
              acesso total ao sistema, ignorando todas as verificações de role e permissão.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Pode acessar qualquer módulo</li>
              <li>• Pode realizar qualquer ação</li>
              <li>• Não precisa de roles atribuídas</li>
              <li>• Ideal para administradores do sistema</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funções SQL de Verificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-muted">
            <code className="text-sm">has_role(_user_id, _role)</code>
            <p className="text-xs text-muted-foreground mt-1">Verifica se usuário tem determinada role</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <code className="text-sm">has_permission(_user_id, _module, _permission)</code>
            <p className="text-xs text-muted-foreground mt-1">Verifica permissão específica (inclui check de master)</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <code className="text-sm">is_master_user(_user_id)</code>
            <p className="text-xs text-muted-foreground mt-1">Verifica se é usuário master</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <code className="text-sm">get_user_permissions(_user_id)</code>
            <p className="text-xs text-muted-foreground mt-1">Retorna todas permissões agrupadas por módulo</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
