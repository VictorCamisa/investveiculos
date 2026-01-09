import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { ModuleName, PermissionType } from '@/types/users';
import { useMemo, useCallback } from 'react';

const ALL_MODULES: ModuleName[] = [
  'crm',
  'vendas',
  'estoque',
  'financeiro',
  'marketing',
  'comissoes',
  'configuracoes',
  'usuarios',
];

const ALL_PERMISSIONS: PermissionType[] = ['view', 'create', 'edit', 'delete', 'manage'];

interface UserPermissionsData {
  isActive: boolean;
  permissions: { module: ModuleName; permission: PermissionType }[];
}

export function usePermissions() {
  const { user, session } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['my-permissions', user?.id],
    queryFn: async (): Promise<UserPermissionsData> => {
      // No restrictions: any authenticated user has full access to all modules/actions.
      const permissions = ALL_MODULES.flatMap((module) =>
        ALL_PERMISSIONS.map((permission) => ({ module, permission }))
      );

      return {
        isActive: true,
        permissions,
      };
    },
    enabled: !!user?.id && !!session?.access_token,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    retry: 1,
  });

  const hasPermission = useCallback((module: ModuleName, permission: PermissionType): boolean => {
    if (!data) return false;
    return data.permissions.some(
      (p) => p.module === module && p.permission === permission
    );
  }, [data]);

  const hasModuleAccess = useCallback((module: ModuleName): boolean => {
    if (!data) return false;
    return data.permissions.some((p) => p.module === module);
  }, [data]);

  const getAccessibleModules = useCallback((): ModuleName[] => {
    if (!data) return [];
    const modules = new Set<ModuleName>();
    data.permissions.forEach((p) => modules.add(p.module));
    return Array.from(modules);
  }, [data]);

  const getFirstAccessibleRoute = useCallback((): string => {
    const modules = getAccessibleModules();
    
    const routeMap: Record<ModuleName, string> = {
      crm: '/crm',
      vendas: '/vendas',
      estoque: '/estoque',
      financeiro: '/financeiro',
      marketing: '/marketing',
      comissoes: '/comissoes',
      configuracoes: '/configuracoes',
      usuarios: '/configuracoes',
    };

    const priority: ModuleName[] = ['crm', 'vendas', 'estoque', 'financeiro', 'marketing', 'comissoes', 'configuracoes'];
    
    for (const mod of priority) {
      if (modules.includes(mod)) {
        return routeMap[mod];
      }
    }

    return '/dashboard';
  }, [getAccessibleModules]);

  return useMemo(() => ({
    isActive: data?.isActive ?? true,
    isLoading,
    hasPermission,
    hasModuleAccess,
    getAccessibleModules,
    getFirstAccessibleRoute,
  }), [data, isLoading, hasPermission, hasModuleAccess, getAccessibleModules, getFirstAccessibleRoute]);
}
