import { useState } from "react";
import { DocumentationNav } from "./DocumentationNav";
import { OverviewSection } from "./sections/OverviewSection";
import { ModulesSection } from "./sections/ModulesSection";
import { DatabaseSection } from "./sections/DatabaseSection";
import { EdgeFunctionsSection } from "./sections/EdgeFunctionsSection";
import { PermissionsSection } from "./sections/PermissionsSection";
import { IntegrationsSection } from "./sections/IntegrationsSection";
import { TutorialsSection } from "./sections/TutorialsSection";
import { RoutesSection } from "./sections/RoutesSection";
import { HooksSection } from "./sections/HooksSection";
import { Input } from "@/components/ui/input";
import { Search, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export type DocSection = 
  | "overview" 
  | "modules" 
  | "database" 
  | "edge-functions" 
  | "permissions" 
  | "integrations" 
  | "tutorials"
  | "routes"
  | "hooks";

export const DocumentationLayout = () => {
  const [activeSection, setActiveSection] = useState<DocSection>("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection searchTerm={searchTerm} />;
      case "modules":
        return <ModulesSection searchTerm={searchTerm} />;
      case "database":
        return <DatabaseSection searchTerm={searchTerm} />;
      case "edge-functions":
        return <EdgeFunctionsSection searchTerm={searchTerm} />;
      case "permissions":
        return <PermissionsSection searchTerm={searchTerm} />;
      case "integrations":
        return <IntegrationsSection searchTerm={searchTerm} />;
      case "tutorials":
        return <TutorialsSection searchTerm={searchTerm} />;
      case "routes":
        return <RoutesSection searchTerm={searchTerm} />;
      case "hooks":
        return <HooksSection searchTerm={searchTerm} />;
      default:
        return <OverviewSection searchTerm={searchTerm} />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-lg">Documentação</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <DocumentationNav 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
        </ScrollArea>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-5xl">
          {renderSection()}
        </div>
      </ScrollArea>
    </div>
  );
};
