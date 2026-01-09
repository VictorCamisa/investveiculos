import { CodeBlock } from "./CodeBlock";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Parameter {
  name: string;
  type: string;
  description?: string;
}

interface FunctionDocProps {
  name: string;
  description: string;
  parameters?: Parameter[];
  returnType?: string;
  code?: string;
  security?: "DEFINER" | "INVOKER";
  className?: string;
}

export const FunctionDoc = ({ 
  name, 
  description, 
  parameters = [], 
  returnType,
  code,
  security,
  className 
}: FunctionDocProps) => {
  return (
    <div className={cn("rounded-lg border p-4 space-y-3", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-mono font-semibold">{name}()</h4>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex gap-2">
          {security && (
            <Badge variant={security === "DEFINER" ? "default" : "secondary"}>
              SECURITY {security}
            </Badge>
          )}
          {returnType && (
            <Badge variant="outline" className="font-mono">
              → {returnType}
            </Badge>
          )}
        </div>
      </div>

      {parameters.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2">Parâmetros</h5>
          <div className="space-y-1">
            {parameters.map((param) => (
              <div key={param.name} className="flex items-center gap-2 text-sm">
                <code className="px-1.5 py-0.5 bg-muted rounded text-xs">{param.name}</code>
                <span className="text-muted-foreground">:</span>
                <Badge variant="outline" className="font-mono text-xs">{param.type}</Badge>
                {param.description && (
                  <span className="text-muted-foreground text-xs">- {param.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {code && (
        <CodeBlock code={code} language="sql" />
      )}
    </div>
  );
};
