import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default UserLayout;
