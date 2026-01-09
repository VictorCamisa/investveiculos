import { Megaphone } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { MarketingPageSimplified } from './MarketingPageSimplified';

export default function MarketingLayout() {
  return (
    <div>
      <ModuleHeader
        icon={Megaphone}
        title="Marketing"
        description="Campanhas, análises e automações"
        basePath="/marketing"
        navItems={[]}
      />
      <div className="p-6">
        <MarketingPageSimplified />
      </div>
    </div>
  );
}
