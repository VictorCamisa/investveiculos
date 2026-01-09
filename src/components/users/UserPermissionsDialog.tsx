import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useUpdateUserPermissions } from '@/hooks/useUsers';
import {
  MODULE_LABELS,
  PERMISSION_LABELS,
  type ModuleName,
  type PermissionType,
  type UserWithRoles,
} from '@/types/users';
import { Loader2, Shield } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserWithRoles;
}

const MODULES: ModuleName[] = [
  'crm',
  'vendas',
  'estoque',
  'financeiro',
  'marketing',
  'comissoes',
  'configuracoes',
  'usuarios',
];

const PERMISSIONS: PermissionType[] = ['view', 'create', 'edit', 'delete', 'manage'];

export function UserPermissionsDialog({ open, onOpenChange, user }: UserPermissionsDialogProps) {
  const updatePermissions = useUpdateUserPermissions();

  const [selectedPermissions, setSelectedPermissions] = useState<
    { module: ModuleName; permission: PermissionType }[]
  >([]);

  useEffect(() => {
    if (user) {
      setSelectedPermissions(
        user.permissions.map((p) => ({
          module: p.module as ModuleName,
          permission: p.permission as PermissionType,
        }))
      );
    }
  }, [user, open]);

  const hasPermission = (module: ModuleName, permission: PermissionType) => {
    return selectedPermissions.some(
      (p) => p.module === module && p.permission === permission
    );
  };

  const togglePermission = (module: ModuleName, permission: PermissionType) => {
    if (hasPermission(module, permission)) {
      setSelectedPermissions((prev) =>
        prev.filter((p) => !(p.module === module && p.permission === permission))
      );
    } else {
      setSelectedPermissions((prev) => [...prev, { module, permission }]);
    }
  };

  const toggleAllForModule = (module: ModuleName) => {
    const hasAll = PERMISSIONS.every((p) => hasPermission(module, p));
    if (hasAll) {
      setSelectedPermissions((prev) => prev.filter((p) => p.module !== module));
    } else {
      const newPerms = PERMISSIONS.filter((p) => !hasPermission(module, p)).map((p) => ({
        module,
        permission: p,
      }));
      setSelectedPermissions((prev) => [...prev, ...newPerms]);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    await updatePermissions.mutateAsync({
      userId: user.id,
      permissions: selectedPermissions,
    });

    onOpenChange(false);
  };

  const isGerente = user?.roles.includes('gerente');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissões de {user?.full_name}
          </DialogTitle>
          <DialogDescription>
            Configure quais módulos e ações este usuário pode acessar
          </DialogDescription>
        </DialogHeader>

        {isGerente && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm">
            <p className="font-medium text-primary">
              Gerentes têm acesso total ao sistema
            </p>
            <p className="text-muted-foreground mt-1">
              As permissões abaixo são aplicadas apenas quando o usuário não tem a função de
              Gerente.
            </p>
          </div>
        )}

        <ScrollArea className="max-h-[400px]">
          <div className="rounded-lg border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Módulo</th>
                  {PERMISSIONS.map((perm) => (
                    <th key={perm} className="text-center p-3 font-medium text-sm">
                      {PERMISSION_LABELS[perm]}
                    </th>
                  ))}
                  <th className="text-center p-3 font-medium text-sm">Todos</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {MODULES.map((module) => (
                  <tr key={module} className="hover:bg-muted/30">
                    <td className="p-3 font-medium">{MODULE_LABELS[module]}</td>
                    {PERMISSIONS.map((perm) => (
                      <td key={perm} className="text-center p-3">
                        <Checkbox
                          checked={hasPermission(module, perm)}
                          onCheckedChange={() => togglePermission(module, perm)}
                        />
                      </td>
                    ))}
                    <td className="text-center p-3">
                      <Checkbox
                        checked={PERMISSIONS.every((p) => hasPermission(module, p))}
                        onCheckedChange={() => toggleAllForModule(module)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={updatePermissions.isPending}>
            {updatePermissions.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Salvar Permissões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
