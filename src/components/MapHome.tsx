import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import type { LocationNode, LocationNodeType } from '../types';
import { Plus, Trash2, ChevronRight, Home as HomeIcon, LayoutGrid, Package, ArrowLeft, Image as ImageIcon } from 'lucide-react';

const EMOJI_OPTIONS = ['🛏️', '🍳', '🛋️', '🚿', '🚪', '📥', '📦', '📚', '🥫', '🗄️', '💼', '🏡', '✍️', '📺', '🔒', '🔑', '🎨', '👔', '👟', '🧸'];

export const MapHome: React.FC = () => {
  const { 
    nodes, 
    things, 
    addNode, 
    deleteNode, 
    getLocationPathString 
  } = useInventory();

  // Active path of navigation in the tree. E.g. [] is top (home / room list), ['room-bedroom'] is in bedroom, etc.
  const [activePath, setActivePath] = useState<string[]>([]);
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<LocationNodeType>('furniture');
  const [newIcon, setNewIcon] = useState('🚪');
  const [newPhoto, setNewPhoto] = useState<string | undefined>(undefined);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentParentId = activePath.length > 0 ? activePath[activePath.length - 1] : null;
  const currentParentNode = currentParentId ? nodes.find(n => n.id === currentParentId) : null;

  // Filter nodes under current active node
  const displayedNodes = nodes.filter(n => n.parentId === currentParentId);

  // Find all items stored in or under the current location path
  const getItemsUnderLocation = (locationId: string | null): typeof things => {
    if (!locationId) return [];
    
    // Find all children recursively
    const getChildIds = (id: string): string[] => {
      const children = nodes.filter(n => n.parentId === id);
      return [id, ...children.flatMap(c => getChildIds(c.id))];
    };
    
    const targetIds = getChildIds(locationId);
    return things.filter(t => t.locationPath.some(pathId => targetIds.includes(pathId)));
  };

  // Direct items in the current node specifically
  const directItems = things.filter(t => {
    if (!currentParentId) return false;
    // The leaf node of the thing's path must equal the current node
    return t.locationPath[thingPathLength(t) - 1] === currentParentId;
  });

  function thingPathLength(t: any) {
    return t.locationPath.length;
  }

  // Node child and item counts
  const getNodeStats = (node: LocationNode) => {
    const directChildren = nodes.filter(n => n.parentId === node.id).length;
    const recursiveItems = getItemsUnderLocation(node.id).length;
    return { directChildren, recursiveItems };
  };

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // If we are at root, the type is always 'room'
    const type = currentParentId ? newType : 'room';
    
    addNode(newName.trim(), type, currentParentId, newIcon, newPhoto);
    setNewName('');
    setNewPhoto(undefined);
    setShowAddForm(false);
  };

  const handleDeleteNode = (id: string) => {
    const stats = getNodeStats(nodes.find(n => n.id === id)!);
    const confirmMsg = `Are you sure you want to delete this location? This will also delete ${stats.directChildren} sub-locations and ${stats.recursiveItems} items.`;
    if (window.confirm(confirmMsg)) {
      deleteNode(id);
    }
  };

  const navigateToLevel = (index: number) => {
    setActivePath(prev => prev.slice(0, index + 1));
  };

  const getBreadcrumbs = () => {
    return activePath.map((id) => nodes.find(n => n.id === id)).filter((n): n is LocationNode => !!n);
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex flex-col gap-4 animate-slide-up pb-6">
      
      {/* Navigation Header / Breadcrumbs */}
      <div className="glass-panel rounded-2xl p-3 flex flex-wrap items-center gap-1 text-xs font-semibold text-gray-400">
        <button 
          onClick={() => setActivePath([])}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg hover:text-white transition-colors ${activePath.length === 0 ? 'text-indigo-400 bg-indigo-950/20' : ''}`}
        >
          <HomeIcon className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <button
              onClick={() => navigateToLevel(idx)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg hover:text-white transition-colors ${idx === activePath.length - 1 ? 'text-indigo-400 bg-indigo-950/20' : ''}`}
            >
              <span>{crumb.icon}</span>
              <span>{crumb.name}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Sub-header or Title */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-base font-extrabold text-white">
            {currentParentNode ? `${currentParentNode.icon} ${currentParentNode.name}` : '🏠 Map My Home'}
          </h3>
          <p className="text-xs text-gray-400 font-medium">
            {currentParentNode 
              ? `Manage spaces and items inside this location` 
              : 'Add, view, and organize rooms in your home'}
          </p>
        </div>

        {activePath.length > 0 && (
          <button 
            onClick={() => setActivePath(prev => prev.slice(0, -1))}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 text-gray-400 hover:text-white border border-gray-800 text-xs font-medium active:scale-95 transition-all"
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
        )}
      </div>

      {/* Grid of Locations */}
      <div className="grid grid-cols-1 gap-3">
        {displayedNodes.map((node) => {
          const { directChildren, recursiveItems } = getNodeStats(node);
          return (
            <div 
              key={node.id}
              className="glass-panel rounded-2xl p-4 flex items-center justify-between hover:border-indigo-500/25 transition-all group"
            >
              <div 
                onClick={() => setActivePath(prev => [...prev, node.id])}
                className="flex items-center gap-3.5 flex-1 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-950/20 group-hover:bg-indigo-600/10 flex items-center justify-center text-2xl shadow-inner border border-white/5 group-hover:border-indigo-500/20 transition-all overflow-hidden relative">
                  {node.photo ? (
                    <>
                      <img src={node.photo} alt={node.name} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-0.5 text-[9px] bg-slate-950/80 px-0.5 rounded leading-none">{node.icon}</span>
                    </>
                  ) : (
                    node.icon
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {node.name}
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    {node.type.charAt(0).toUpperCase() + node.type.slice(1)} • {directChildren} areas • {recursiveItems} items
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteNode(node.id)}
                  className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                  title="Delete location"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {displayedNodes.length === 0 && !showAddForm && (
          <div className="glass-panel rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2">
            <LayoutGrid className="w-8 h-8 text-gray-600 animate-pulse" />
            <p className="text-sm font-bold text-gray-300">No sub-locations here</p>
            <p className="text-xs text-gray-400">Map cabinets, drawers, or containers to organize items.</p>
            <button
              onClick={() => {
                setNewIcon(currentParentNode ? '🚪' : '🛏️');
                setNewType(currentParentId ? 'furniture' : 'room');
                setShowAddForm(true);
              }}
              className="mt-3 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Map First Zone
            </button>
          </div>
        )}
      </div>

      {/* Add New Form Button */}
      {!showAddForm && displayedNodes.length > 0 && (
        <button
          onClick={() => {
            setNewIcon(currentParentNode ? '🚪' : '🛏️');
            setNewType(currentParentId ? 'furniture' : 'room');
            setShowAddForm(true);
          }}
          className="flex items-center justify-center gap-2 py-3 border border-dashed border-gray-800 hover:border-indigo-500/40 rounded-2xl text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/5 hover:bg-indigo-950/10 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add {currentParentId ? 'Sub-Location (Zone)' : 'Room'}
        </button>
      )}

      {/* Add Form Panel */}
      {showAddForm && (
        <form onSubmit={handleCreateNode} className="glass-panel rounded-2xl p-4 flex flex-col gap-4 animate-slide-up">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Create {currentParentId ? 'Sub-Location' : 'Room'}
          </h4>

          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Location Name
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={currentParentId ? 'e.g. Wardrobe, Top Shelf, Box A' : 'e.g. Living Room, Bedroom'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Type Picker (if inside a room) */}
          {currentParentId && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Location Type
              </label>
              <select
                value={newType}
                onChange={(e) => {
                  setNewType(e.target.value as LocationNodeType);
                  // Update default icons based on type
                  if (e.target.value === 'drawer') setNewIcon('📥');
                  else if (e.target.value === 'box') setNewIcon('📦');
                  else if (e.target.value === 'shelf') setNewIcon('🗄️');
                  else if (e.target.value === 'cabinet') setNewIcon('🥫');
                  else setNewIcon('🚪');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500/50"
              >
                <option value="furniture">Furniture (Table, Desk, Sofa, etc.)</option>
                <option value="cabinet">Cabinet / Wardrobe</option>
                <option value="shelf">Shelf</option>
                <option value="drawer">Drawer</option>
                <option value="box">Box / Bag / Container</option>
                <option value="other">Other / Custom</option>
              </select>
            </div>
          )}

          {/* Emoji / Icon Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Select Symbol
            </label>
            <div className="grid grid-cols-8 gap-2 bg-slate-900/60 p-2 rounded-xl border border-gray-800/80 max-h-[110px] overflow-y-auto">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setNewIcon(emoji)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all ${newIcon === emoji ? 'bg-indigo-600 text-white scale-110' : 'hover:bg-slate-800'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Mapping Photo selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Scan / Snap Location Photo (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="w-14 h-14 rounded-xl border border-dashed border-gray-800 hover:border-indigo-500/40 flex flex-col items-center justify-center text-gray-500 cursor-pointer bg-slate-900/40 overflow-hidden relative active:scale-95 transition-all">
                {newPhoto ? (
                  <img src={newPhoto} alt="Zone Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              <div className="flex flex-col">
                <span className="text-xs text-gray-300 font-semibold">{newPhoto ? 'Photo added' : 'No photo uploaded'}</span>
                <span className="text-[10px] text-gray-500 mt-0.5">Capture local cabinet/space details</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewName('');
              }}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl bg-slate-900 border border-gray-800 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/10 active:scale-95 transition-all"
            >
              Create Location
            </button>
          </div>
        </form>
      )}

      {/* Items Stored directly at this leaf location */}
      {currentParentId && (
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex items-center gap-1.5 text-gray-400 px-1">
            <Package className="w-4 h-4 text-pink-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              {directItems.length === 0 ? 'No items directly in this zone' : `Items in this location (${directItems.length})`}
            </h3>
          </div>

          {directItems.length > 0 && (
            <div className="flex flex-col gap-2">
              {directItems.map((thing) => (
                <div 
                  key={thing.id}
                  className="glass-panel rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{thing.name}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Qty: {thing.quantity} • {thing.category}</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-semibold">{getLocationPathString(thing).split(' → ').slice(-1)[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
