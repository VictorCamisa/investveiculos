import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Column {
  name: string;
  type: string;
  nullable?: boolean;
  defaultValue?: string;
  description?: string;
}

interface TableSchemaProps {
  tableName: string;
  columns: Column[];
  description?: string;
  className?: string;
}

export const TableSchema = ({ tableName, columns, description, className }: TableSchemaProps) => {
  return (
    <div className={cn("rounded-lg border overflow-hidden", className)}>
      <div className="px-4 py-3 bg-muted/50 border-b">
        <h4 className="font-mono font-semibold text-sm">{tableName}</h4>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Coluna</TableHead>
            <TableHead className="w-[140px]">Tipo</TableHead>
            <TableHead className="w-[80px]">Null</TableHead>
            <TableHead>Default</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {columns.map((col) => (
            <TableRow key={col.name}>
              <TableCell className="font-mono text-xs">{col.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs">
                  {col.type}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={cn(
                  "text-xs",
                  col.nullable ? "text-yellow-600" : "text-green-600"
                )}>
                  {col.nullable ? "YES" : "NO"}
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {col.defaultValue || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
