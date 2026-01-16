import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MessageSquare, LayoutGrid } from 'lucide-react';
import { ReportChat } from './ReportChat';
import { ReportGallery } from './ReportGallery';

const tabs = [
  { id: 'chat', label: 'Chat com IA', icon: MessageSquare },
  { id: 'gallery', label: 'Galeria', icon: LayoutGrid },
];

export function ReportsLayout() {
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedReport(templateId);
    setActiveTab('chat');
  };

  return (
    <div className="space-y-4">
      {/* Simple pill navigation */}
      <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'chat' && (
        <ReportChat initialTemplate={selectedReport} onClearTemplate={() => setSelectedReport(null)} />
      )}

      {activeTab === 'gallery' && (
        <ReportGallery onSelectTemplate={handleSelectTemplate} />
      )}
    </div>
  );
}
