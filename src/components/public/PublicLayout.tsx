import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { WhatsAppButton } from './WhatsAppButton';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-black text-white">
      <PublicHeader />
      <main>
        <Outlet />
      </main>
      <PublicFooter />
      <WhatsAppButton />
    </div>
  );
}

export default PublicLayout;
