import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Package,
  ShoppingCart,
  Settings,
  Store,
  Users,
  LogOut,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  // Navigation config
  const navItems = [
    {
      path: '/dashboard',
      icon: LayoutGrid,
      label: 'Dashboard'
    },
    {
      path: '/checkout',
      icon: ShoppingCart,
      label: 'Checkout'
    },
    {
      path: '/customers',
      icon: Users,
      label: 'Customers'
    }
  ];

  // If Admin, append Inventory page link
  if (isAdmin) {
    navItems.splice(1, 0, {
      path: '/inventory',
      icon: Package,
      label: 'Inventory'
    });
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  return (
    <aside className="w-20 lg:w-64 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-20 sticky top-0 print:hidden">
      
      {/* Logo Area */}
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-100">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200">
          <Store size={20} aria-hidden="true" />
        </div>
        <span className="hidden lg:block ml-3 font-bold text-xl text-slate-900 tracking-tight">
          Lumina<span className="text-indigo-600">POS</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 lg:px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-center lg:justify-start px-3 lg:px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <item.icon size={22} className="transition-colors" aria-hidden="true" />
            <span className="hidden lg:block ml-3 text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Profile Details */}
      <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
        {/* Logged in User Indicator */}
        {user && (
          <div className="hidden lg:flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
              {isAdmin ? <ShieldCheck size={20} /> : <UserCheck size={20} />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate leading-snug">{user.displayName}</p>
              <p className="text-[10px] text-slate-400 capitalize font-medium flex items-center gap-0.5 mt-0.5">
                {user.role} role
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-1 lg:gap-2">
          {/* Settings button */}
          <button
            onClick={() => navigate('/settings')}
            className="flex-1 flex items-center justify-center lg:justify-start px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors group text-xs font-semibold gap-2"
            aria-label="Settings"
          >
            <Settings
              size={18}
              className="text-slate-400 group-hover:text-slate-600 animate-spin-slow"
              aria-hidden="true"
            />
            <span className="hidden lg:block">Settings</span>
          </button>

          {/* Sign out button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors group text-xs font-semibold gap-2"
            aria-label="Logout"
          >
            <LogOut size={18} className="text-red-400 group-hover:text-red-650" aria-hidden="true" />
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
      </div>

    </aside>
  );
}