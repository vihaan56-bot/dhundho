import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { Search, MapPin, Package, Clock, Plus, HelpCircle, ArrowRight, Compass, Camera } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    things, 
    nodes, 
    searchHistory, 
    setView, 
    getLocationPathString,
    loadDemoData
  } = useInventory();

  // Get recently added items (up to 3)
  const recentThings = [...things]
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 3);

  const totalRooms = nodes.filter(n => n.type === 'room').length;
  const totalLocations = nodes.filter(n => n.type !== 'room').length;

  const handleRecentSearchClick = (query: string) => {
    // Navigate to ask view and pass query via local storage or context state.
    // We will save query to a session variable or trigger it.
    localStorage.setItem('dhundho_pending_query', query);
    setView('ask');
  };



  return (
    <div className="flex flex-col gap-6 pb-6 animate-slide-up">
      {/* Brand & Tagline */}
      <div className="text-center py-4 flex flex-col items-center relative">
        {/* Soft background glow */}
        <div className="absolute top-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl -z-10"></div>
        <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-500/20 mb-2">
          Beta MVP
        </span>
        <h2 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-2">
          Dhundho
        </h2>
        <p className="text-gray-400 text-sm italic font-medium">
          “Bas poochho, cheez mil jayegi.”
        </p>
      </div>

      {/* Hero Interactive Search Trigger */}
      <div 
        onClick={() => setView('ask')}
        className="glass-panel rounded-2xl p-4 cursor-pointer hover:border-indigo-500/40 hover:bg-slate-900/40 transition-all group shadow-lg"
      >
        <div className="flex items-center gap-3 text-gray-500 group-hover:text-gray-400 transition-colors">
          <Search className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-medium text-gray-400 flex-1">
            Where is your passport? Ask Dhundho...
          </span>
          <span className="px-2 py-1 rounded-lg bg-indigo-600/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider group-hover:bg-indigo-600 group-hover:text-white transition-all">
            Ask AI
          </span>
        </div>
      </div>

      {/* AI Camera Mapping Scanner Trigger */}
      <div 
        onClick={() => {
          localStorage.setItem('dhundho_active_tab', 'scanner');
          setView('ask');
        }}
        className="glass-panel rounded-2xl p-4 hover:border-pink-500/40 hover:bg-slate-900/40 transition-all group shadow-lg flex items-center gap-3.5 cursor-pointer relative"
      >
        <div className="w-10 h-10 rounded-xl bg-pink-600/15 group-hover:bg-pink-600 text-pink-400 group-hover:text-white flex items-center justify-center transition-all shrink-0">
          <Camera className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white mb-0.5 flex items-center gap-1.5">
            AI Camera Scanner <span className="text-[9px] bg-pink-600/20 text-pink-400 font-extrabold uppercase px-1.5 py-0.5 rounded border border-pink-500/10">New</span>
          </h3>
          <p className="text-xs text-gray-400 font-medium">
            Tap screen to identify & map objects instantly with AI
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>

      {/* Grid Stats & Navigation */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => setView('map')}
          className="glass-panel rounded-2xl p-4 hover:border-indigo-500/30 transition-all cursor-pointer flex flex-col gap-3 relative group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-0.5">Map Home</h3>
            <p className="text-xs text-gray-400 font-medium">
              {totalRooms} rooms • {totalLocations} zones
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all absolute top-4 right-4" />
        </div>

        <div 
          onClick={() => setView('things')}
          className="glass-panel rounded-2xl p-4 hover:border-pink-500/30 transition-all cursor-pointer flex flex-col gap-3 relative group"
        >
          <div className="w-10 h-10 rounded-xl bg-pink-600/10 flex items-center justify-center text-pink-400 group-hover:bg-pink-600 group-hover:text-white transition-all">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-0.5">My Things</h3>
            <p className="text-xs text-gray-400 font-medium">
              {things.length} items cataloged
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all absolute top-4 right-4" />
        </div>
      </div>

      {/* Recent Searches Section */}
      {searchHistory.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 text-gray-400 px-1">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Recently Searched</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(0, 4).map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleRecentSearchClick(entry.query)}
                className="px-3.5 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800 text-xs font-medium text-gray-300 hover:text-white border border-gray-800 transition-all active:scale-95 cursor-pointer"
              >
                “{entry.query}”
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recently Added Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Compass className="w-4 h-4 text-pink-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Recently Added</h3>
          </div>
          <button 
            onClick={() => setView('things')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors"
          >
            See All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentThings.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 text-center flex flex-col items-center gap-2">
            <HelpCircle className="w-8 h-8 text-gray-600" />
            <p className="text-sm font-bold text-gray-300">Koi cheez dhoondh rahe ho?</p>
            <p className="text-xs text-gray-400">Bas poochho. Dhundho yaad rakhta hai.</p>
            <div className="flex gap-3 justify-center mt-3 w-full">
              <button
                onClick={() => setView('add')}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/10 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
              <button
                type="button"
                onClick={loadDemoData}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-indigo-400 hover:text-indigo-300 font-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                ✨ Load Demo
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentThings.map((thing) => {
              const pathString = getLocationPathString(thing);
              const roomNode = nodes.find(n => n.id === thing.locationPath[0]);
              const roomIcon = roomNode ? roomNode.icon : '📍';
              
              // Map category to styles
              const getCatClass = (cat: typeof thing.category) => {
                const lower = cat.toLowerCase();
                return `cat-tag-${lower}`;
              };

              return (
                <div 
                  key={thing.id}
                  className="glass-panel rounded-2xl p-3.5 flex items-center justify-between hover:border-white/15 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-xl shadow-inner border border-white/5">
                      {roomIcon}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white leading-none">
                          {thing.name}
                        </h4>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${getCatClass(thing.category)}`}>
                          {thing.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1 truncate max-w-[200px]">
                        {pathString || 'No location mapped'}
                      </span>
                    </div>
                  </div>


                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
