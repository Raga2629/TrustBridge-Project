import { Outlet, useLocation, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

function AuthHeader() {
  return (
    <header className="w-full bg-white border-b border-slate-200/50 py-4 px-6 sm:px-10 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/10">
          <Shield className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="font-bold text-slate-900 text-lg tracking-tight">TrustBridge</span>
      </Link>
      <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
        Back to Home
      </Link>
    </header>
  );
}

export default function Layout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {isAuthPage ? <AuthHeader /> : <Navbar />}
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}
