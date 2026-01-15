import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PublicChatWidget } from './PublicChatWidget';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-public-bg text-public-fg">
      <PublicHeader />
      <main>
        <Outlet />
      </main>
      <PublicFooter />
      <PublicChatWidget />
    </div>
  );
}

export default PublicLayout;
