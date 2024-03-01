import { Toaster } from 'sonner';
import { Outlet } from 'react-router-dom';

import Nav from '../components/Nav';

export function BaseLayout() {
  return (
    <div>
      <main className="h-screen overflow-hidden">
        <Nav></Nav>
        <div className="h-[calc(100vh-64px)] max-w-[1280px] mx-auto pb-6">
          <Outlet />
        </div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
