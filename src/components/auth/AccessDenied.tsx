import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

export function AccessDenied() {
  const navigate = useNavigate();
  const { getFirstAccessibleRoute } = usePermissions();

  const handleGoBack = () => {
    const firstRoute = getFirstAccessibleRoute();
    navigate(firstRoute);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-4 rounded-full bg-destructive/10">
          <ShieldX className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Acesso Restrito</h1>
        <p className="text-muted-foreground max-w-md">
          Você não tem permissão para acessar este módulo. 
          Entre em contato com o administrador para solicitar acesso.
        </p>
      </div>
      <Button onClick={handleGoBack} variant="outline" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Voltar para área acessível
      </Button>
    </div>
  );
}
