import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Package,
  ShoppingCart,
  Settings,
  Store
} from 'lucide-react';

export function Sidebar() {
  const navItems = [
     {
      path: '/dashboard',
      icon: LayoutGrid,
      label: 'Dashboard'
    },
    {
      path: '/inventory',
      icon: Package,
      label: 'Inventory'
    },
    {
      path: '/checkout',
      icon: ShoppingCart,
      label: 'Checkout'
    }
  ];

  return (
    <aside className="w-20 lg:w-64 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-20 sticky top-0">
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
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
            aria-current={({ isActive }: { isActive: boolean }) =>
              isActive ? 'page' : undefined
            }>
            <item.icon size={22} className="transition-colors" aria-hidden="true" />
            <span className="hidden lg:block ml-3">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / User */}
      <div className="p-4 border-t border-slate-100">
        <button
          className="w-full flex items-center justify-center lg:justify-start px-3 lg:px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
          aria-label="Settings">
          <Settings
            size={22}
            className="text-slate-400 group-hover:text-slate-600"
            aria-hidden="true"
          />

          <span className="hidden lg:block ml-3 font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
}