import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  className?: string;
}

export const SectionHeader = ({ title, description, icon: Icon, className }: SectionHeaderProps) => {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};
