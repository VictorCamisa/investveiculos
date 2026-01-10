export type AppRole = 'gerente' | 'vendedor' | 'marketing';

export type ModuleName = 
  | 'crm' 
  | 'vendas' 
  | 'estoque' 
  | 'financeiro' 
  | 'marketing' 
  | 'comissoes' 
  | 'configuracoes' 
  | 'usuarios';

export type PermissionType = 'view' | 'create' | 'edit' | 'delete' | 'manage';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  module: ModuleName;
  permission: PermissionType;
  created_at: string;
  granted_at?: string;
  granted_by?: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_master: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserWithRoles extends UserProfile {
  roles: AppRole[];
  permissions: UserPermission[];
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_profile?: UserProfile;
}

export const MODULE_LABELS: Record<ModuleName, string> = {
  crm: 'CRM / Leads',
  vendas: 'Vendas',
  estoque: 'Estoque',
  financeiro: 'Financeiro',
  marketing: 'Marketing',
  comissoes: 'Comissões',
  configuracoes: 'Configurações',
  usuarios: 'Usuários',
};

export const PERMISSION_LABELS: Record<PermissionType, string> = {
  view: 'Visualizar',
  create: 'Criar',
  edit: 'Editar',
  delete: 'Excluir',
  manage: 'Gerenciar',
};

export const ROLE_LABELS: Record<AppRole, string> = {
  gerente: 'Gerente',
  vendedor: 'Vendedor',
  marketing: 'Marketing',
};

// Default permissions by role (used as template when creating users)
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<AppRole, { module: ModuleName; permissions: PermissionType[] }[]> = {
  gerente: [
    { module: 'crm', permissions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'vendas', permissions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'estoque', permissions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'financeiro', permissions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'marketing', permissions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'comissoes', permissions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'configuracoes', permissions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'usuarios', permissions: ['view', 'create', 'edit', 'delete', 'manage'] },
  ],
  vendedor: [
    { module: 'crm', permissions: ['view', 'create', 'edit'] },
    { module: 'vendas', permissions: ['view'] },
    { module: 'estoque', permissions: ['view'] },
    { module: 'comissoes', permissions: ['view'] },
  ],
  marketing: [
    { module: 'crm', permissions: ['view', 'create', 'edit'] },
    { module: 'marketing', permissions: ['view', 'create', 'edit', 'manage'] },
    { module: 'vendas', permissions: ['view'] },
  ],
};
