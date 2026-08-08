import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { Home, Sparkles, MapPin, Package, PlusCircle, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentView, setView, logout } = useInventory();

  const navItems = [
    { view: 'dashboard' as const, label: 'Home', icon: Home },
    { view: 'ask' as const, label: 'Ask AI', icon: Sparkles, highlight: true },
    { view: 'map' as const, label: 'Map Home', icon: MapPin },
    { view: 'things' as const, label: 'Inventory', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-[#05070c] flex items-center justify-center py-0 sm:py-6 px-0">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[850px] sm:max-h-[900px] sm:rounded-3xl bg-[#090d16] border-0 sm:border border-gray-900/60 shadow-2xl relative flex flex-col overflow-hidden animate-slide-up">
        
        {/* Top Header */}
        <header className="glass-panel sticky top-0 z-40 px-5 py-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-600/30">
              D
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white m-0 leading-none">Dhundho</h1>
              <span className="text-[10px] text-indigo-400 font-medium tracking-wide">BAS POOCHHO</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setView('add')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
            <button 
              onClick={logout}
              className="p-1.5 rounded-xl bg-slate-900 border border-gray-800 text-gray-500 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
          {children}
        </main>

        {/* Bottom Tab Bar */}
        <nav className="nav-blur absolute bottom-0 left-0 right-0 z-40 border-t border-white/5 py-2 px-6 flex justify-between items-center rounded-b-0 sm:rounded-b-3xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view || (item.view === 'ask' && currentView === 'ar');
            
            if (item.highlight) {
              return (
                <button
                  key={item.view}
                  onClick={() => setView(item.view)}
                  className={`relative -top-5 flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-tr from-indigo-500 to-pink-500 text-white shadow-indigo-500/35 ring-4 ring-[#090d16]'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/35 ring-4 ring-[#090d16]'
                  }`}
                >
                  <Icon className="w-6 h-6 animate-pulse" />
                  <span className="text-[9px] absolute -bottom-5 font-semibold text-indigo-400 tracking-wider">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'text-indigo-400 font-medium' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
