import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Search, MapPin, Trash2, Edit2, Package } from 'lucide-react';

export const MyThings: React.FC = () => {
  const { 
    things, 
    nodes, 
    getLocationPathString, 
    setView, 
    selectThingForAR,
    deleteThing 
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  const rooms = nodes.filter(n => n.type === 'room');
  const categories = ['Electronics', 'Documents', 'Tools', 'Kitchen', 'Clothing', 'Other'];

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      deleteThing(id);
    }
  };

  const handleLocate = (thingId: string) => {
    selectThingForAR(thingId);
    setView('ar');
  };

  const handleEdit = (thingId: string) => {
    localStorage.setItem('dhundho_editing_thing_id', thingId);
    setView('add');
  };

  // Filter and Sort Items
  const filteredThings = things
    .filter(thing => {
      // 1. Search term match
      const matchesSearch = thing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            thing.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            thing.notes.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Room match
      const matchesRoom = selectedRoomId === 'all' || thing.locationPath[0] === selectedRoomId;

      // 3. Category match
      const matchesCategory = selectedCategory === 'all' || thing.category === selectedCategory;

      return matchesSearch && matchesRoom && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return b.frequencySearched - a.frequencySearched;
      }
      // default: recent
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    });

  return (
    <div className="flex flex-col gap-4 animate-slide-up pb-6">
      
      {/* Title */}
      <div className="px-1">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-400" /> My Things
        </h2>
        <p className="text-xs text-gray-400 font-medium">
          Browse and filter your entire home inventory
        </p>
      </div>

      {/* Internal search bar */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search items, notes, or tags..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500/50"
        />
        <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
      </div>

      {/* FILTER PANEL */}
      <div className="flex flex-col gap-3">
        {/* Room horizontal scroll filters */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Filter by Room</span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
            <button
              onClick={() => setSelectedRoomId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap snap-align-start cursor-pointer border transition-all ${
                selectedRoomId === 'all' 
                  ? 'bg-indigo-600 border-indigo-500 text-white' 
                  : 'bg-slate-900 border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              All Rooms
            </button>
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap snap-align-start cursor-pointer border transition-all ${
                  selectedRoomId === room.id 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-slate-900 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {room.icon} {room.name}
              </button>
            ))}
          </div>
        </div>

        {/* Category horizontal scroll filters */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Filter by Category</span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap snap-align-start cursor-pointer border transition-all ${
                selectedCategory === 'all' 
                  ? 'bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-600/10' 
                  : 'bg-slate-900 border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap snap-align-start cursor-pointer border transition-all ${
                  selectedCategory === cat 
                    ? 'bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-600/10' 
                    : 'bg-slate-900 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sort & Stats Panel */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3 px-1 text-xs">
          <span className="text-gray-400 font-semibold">{filteredThings.length} items found</span>
          
          <div className="flex items-center gap-1.5 bg-slate-900 p-0.5 rounded-xl border border-gray-850">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all ${
                sortBy === 'recent' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all ${
                sortBy === 'popular' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Popular
            </button>
          </div>
        </div>
      </div>

      {/* ITEMS CATALOG LIST */}
      <div className="flex flex-col gap-3 mt-2">
        {filteredThings.map(thing => {
          const pathString = getLocationPathString(thing);
          const roomNode = nodes.find(n => n.id === thing.locationPath[0]);
          const roomIcon = roomNode ? roomNode.icon : '📍';
          
          // Map category tag classes
          const getCatClass = (cat: typeof thing.category) => {
            return `cat-tag-${cat.toLowerCase()}`;
          };

          return (
            <div 
              key={thing.id}
              className="glass-panel rounded-2xl p-4 flex flex-col gap-3.5 hover:border-indigo-500/20 transition-all group"
            >
              {/* Header details */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-center text-xl shadow-inner group-hover:border-indigo-500/10">
                    {roomIcon}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white leading-none">
                        {thing.name}
                      </h4>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${getCatClass(thing.category)}`}>
                        {thing.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-400" />
                      {pathString || 'No location mapped'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEdit(thing.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/15 transition-all cursor-pointer"
                    title="Edit Item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(thing.id, thing.name)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/15 transition-all cursor-pointer"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Expandable note detail info */}
              {(thing.notes || thing.expiryDate) && (
                <div className="text-[11px] bg-slate-950/40 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1 text-gray-500 leading-normal font-medium">
                  {thing.notes && <div>💡 {thing.notes}</div>}
                  {thing.expiryDate && <div className="text-rose-400/90">⏰ Expiry: {thing.expiryDate}</div>}
                </div>
              )}

              {/* Bottom footer button details */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[10px] text-gray-400 font-semibold">
                  Qty: <span className="text-white font-bold">{thing.quantity}</span> • Searched: {thing.frequencySearched}x
                </span>
                
                <button
                  onClick={() => handleLocate(thing.id)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md shadow-indigo-600/10 active:scale-95 transition-all cursor-pointer"
                >
                  Locate
                </button>
              </div>
            </div>
          );
        })}

        {filteredThings.length === 0 && (
          <div className="glass-panel rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2">
            <Package className="w-8 h-8 text-gray-600" />
            <p className="text-sm font-bold text-gray-300">No items found</p>
            <p className="text-xs text-gray-400">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
    </div>
  );
};
