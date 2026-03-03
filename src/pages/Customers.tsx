import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/hooks/useCustomers';
import { Search, Users, Plus, Phone, Mail, MapPin } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';

export default function Customers() {
  const { data: customers = [], isLoading } = useCustomers();
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf_cnpj?.includes(search)
  );

  return (
    <div>
      <ModuleHeader
        icon={Users}
        title="Clientes"
        description="Gestão completa de clientes"
        basePath="/clientes"
        navItems={[]}
      />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, telefone, CPF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Badge variant="secondary">{filtered.length} clientes</Badge>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum cliente encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(customer => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{customer.name}</h3>
                      {customer.cpf_cnpj && <p className="text-xs text-muted-foreground">CPF: {customer.cpf_cnpj}</p>}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {customer.phone && (
                      <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {customer.phone}</p>
                    )}
                    {customer.email && (
                      <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {customer.email}</p>
                    )}
                    {customer.city && (
                      <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {customer.city}{customer.state ? `-${customer.state}` : ''}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
