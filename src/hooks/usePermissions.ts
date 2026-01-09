import { useAuth } from '@/contexts/AuthContext';
import type { ModuleName, PermissionType } from '@/types/users';
import { useMemo, useCallback } from 'react';

// Permissões por role
const PERMISSIONS_BY_ROLE: Record<string, { modules: ModuleName[]; permissions: PermissionType[] }> = {
  gerente: {
    modules: ['crm', 'vendas', 'estoque', 'financeiro', 'marketing', 'comissoes', 'configuracoes', 'usuarios'],
    permissions: ['view', 'create', 'edit', 'delete', 'manage'],
  },
  vendedor: {
    modules: ['crm', 'estoque', 'comissoes'],
    permissions: ['view', 'create', 'edit'],
  },
  marketing: {
    modules: ['crm', 'marketing', 'estoque'],
    permissions: ['view', 'create', 'edit'],
  },
};

export function usePermissions() {
  const { user, role, loading: authLoading, roleLoading } = useAuth();

  // Determina permissões baseado no role
  const permissionsData = useMemo(() => {
    if (!user || !role) {
      return { modules: [] as ModuleName[], permissions: [] as PermissionType[] };
    }
    
    return PERMISSIONS_BY_ROLE[role] || { modules: [], permissions: [] };
  }, [user, role]);

  const hasPermission = useCallback((module: ModuleName, permission: PermissionType): boolean => {
    if (!role) return false;
    const rolePerms = PERMISSIONS_BY_ROLE[role];
    if (!rolePerms) return false;
    return rolePerms.modules.includes(module) && rolePerms.permissions.includes(permission);
  }, [role]);

  const hasModuleAccess = useCallback((module: ModuleName): boolean => {
    if (!role) return false;
    const rolePerms = PERMISSIONS_BY_ROLE[role];
    if (!rolePerms) return false;
    return rolePerms.modules.includes(module);
  }, [role]);

  const getAccessibleModules = useCallback((): ModuleName[] => {
    return permissionsData.modules;
  }, [permissionsData]);

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

  const isVendedor = useMemo(() => role === 'vendedor', [role]);
  const isGerente = useMemo(() => role === 'gerente', [role]);

  const isLoading = authLoading || roleLoading;

  return useMemo(() => ({
    isActive: !!user,
    isLoading,
    hasPermission,
    hasModuleAccess,
    getAccessibleModules,
    getFirstAccessibleRoute,
    role,
    isVendedor,
    isGerente,
  }), [user, isLoading, hasPermission, hasModuleAccess, getAccessibleModules, getFirstAccessibleRoute, role, isVendedor, isGerente]);
}