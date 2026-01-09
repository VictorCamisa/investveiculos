import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, LayoutGrid, FileText } from 'lucide-react';
import { ReportChat } from './ReportChat';
import { ReportGallery } from './ReportGallery';
import { ModuleHeader } from '@/components/layout/ModuleHeader';

export function ReportsLayout() {
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedReport(templateId);
    setActiveTab('chat');
  };

  return (
    <div>
      <ModuleHeader
        icon={FileText}
        title="Relatórios Inteligentes"
        description="Gere relatórios com IA ou escolha templates prontos"
        basePath="/relatorios"
        navItems={[]}
      />
      
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat com IA
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Galeria de Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <ReportChat initialTemplate={selectedReport} onClearTemplate={() => setSelectedReport(null)} />
          </TabsContent>

          <TabsContent value="gallery">
            <ReportGallery onSelectTemplate={handleSelectTemplate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
