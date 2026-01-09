import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VehicleFormComplete, CompleteFormValues } from './VehicleFormComplete';

interface CreateVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CompleteFormValues) => void;
  isLoading?: boolean;
}

export function CreateVehicleDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading 
}: CreateVehicleDialogProps) {
  const handleSubmit = (data: CompleteFormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Veículo</DialogTitle>
        </DialogHeader>
        <VehicleFormComplete onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
}
