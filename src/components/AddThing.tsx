import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import type { Thing } from '../types';
import { ArrowLeft, Image as ImageIcon, FolderPlus } from 'lucide-react';

interface AddThingProps {
  editingThingId?: string | null;
  onSuccess?: () => void;
}

const CATEGORIES: Thing['category'][] = ['Electronics', 'Documents', 'Tools', 'Kitchen', 'Clothing', 'Other'];

export const AddThing: React.FC<AddThingProps> = ({ editingThingId, onSuccess }) => {
  const { 
    nodes, 
    things, 
    addThing, 
    updateThing, 
    setView, 
    addNode 
  } = useInventory();

  const isEditing = !!editingThingId;
  const editingThing = isEditing ? things.find(t => t.id === editingThingId) : null;

  // Form Fields State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Thing['category']>('Electronics');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  // Hierarchical Location Picker state: Array of selected node IDs
  // e.g. [selectedRoomId, selectedSubId1, selectedSubId2, ...]
  const [locationPath, setLocationPath] = useState<string[]>([]);
  
  // Quick location creator state
  const [showQuickLocationForm, setShowQuickLocationForm] = useState(false);
  const [quickLocationName, setQuickLocationName] = useState('');
  const [quickLocationType, setQuickLocationType] = useState<'furniture' | 'cabinet' | 'shelf' | 'drawer' | 'box' | 'other'>('furniture');

  // Pre-fill form if editing
  useEffect(() => {
    if (editingThing) {
      setName(editingThing.name);
      setCategory(editingThing.category);
      setQuantity(editingThing.quantity);
      setNotes(editingThing.notes);
      setTagsInput(editingThing.tags.join(', '));
      setExpiryDate(editingThing.expiryDate || '');
      setPhoto(editingThing.photo);
      setLocationPath(editingThing.locationPath);
    } else {
      // Default to first room if available
      const rooms = nodes.filter(n => n.type === 'room');
      if (rooms.length > 0) {
        setLocationPath([rooms[0].id]);
      }
    }
  }, [editingThing, nodes]);

  // Handle file input for photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to get dropdown nodes for a specific depth index in the locationPath
  const getOptionsForDepth = (depthIndex: number): typeof nodes => {
    if (depthIndex === 0) {
      // Root level - rooms
      return nodes.filter(n => n.type === 'room');
    }
    const parentId = locationPath[depthIndex - 1];
    if (!parentId) return [];
    return nodes.filter(n => n.parentId === parentId);
  };

  // Handle path selection change
  const handlePathChange = (depthIndex: number, nodeId: string) => {
    setLocationPath(prev => {
      const newPath = [...prev.slice(0, depthIndex)];
      if (nodeId) {
        newPath.push(nodeId);
      }
      return newPath;
    });
  };

  // Quick sub-location node creator
  const handleCreateQuickLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLocationName.trim()) return;

    const parentId = locationPath[locationPath.length - 1] || null;
    const iconsMap: Record<string, string> = {
      furniture: '🚪',
      cabinet: '🥫',
      shelf: '🗄️',
      drawer: '📥',
      box: '📦',
      other: '📍'
    };

    const newId = addNode(
      quickLocationName.trim(), 
      quickLocationType, 
      parentId, 
      iconsMap[quickLocationType] || '📍'
    );

    // Auto-select the newly created location node
    setLocationPath(prev => [...prev, newId]);
    setQuickLocationName('');
    setShowQuickLocationForm(false);
  };

  // Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (locationPath.length === 0) {
      alert('Please map this item to a location!');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const thingData = {
      name: name.trim(),
      category,
      quantity,
      locationPath,
      notes: notes.trim(),
      tags,
      expiryDate: expiryDate || undefined,
      photo
    };

    if (isEditing && editingThing) {
      updateThing({
        ...editingThing,
        ...thingData,
      });
    } else {
      addThing(thingData);
    }

    if (onSuccess) {
      onSuccess();
    } else {
      setView('dashboard');
    }
  };

  const currentLeafId = locationPath[locationPath.length - 1];
  const currentLeafNode = currentLeafId ? nodes.find(n => n.id === currentLeafId) : null;

  return (
    <div className="flex flex-col gap-4 pb-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onSuccess ? onSuccess() : setView('dashboard')}
          className="p-2 rounded-xl bg-slate-900 border border-gray-800 text-gray-400 hover:text-white active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-white">
            {isEditing ? '✏️ Edit Thing' : '➕ Add a Thing'}
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            {isEditing ? 'Modify item location and details' : 'Save an item to remember where you kept it'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name and Category */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Basic Info</h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Item Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Batteries, Charger, Passport"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Thing['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500/50"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
        </div>

        {/* Location Picker */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Location Map</h3>
            <button
              type="button"
              onClick={() => setShowQuickLocationForm(true)}
              className="flex items-center gap-1 text-[10px] font-bold text-pink-400 hover:text-pink-300 transition-colors uppercase tracking-wider bg-pink-950/20 px-2 py-1 rounded-lg border border-pink-500/10 active:scale-95"
            >
              <FolderPlus className="w-3 h-3" /> Quick Add Space
            </button>
          </div>

          {/* Render dropdown level dynamically */}
          <div className="flex flex-col gap-3">
            {/* Room selection (always index 0) */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-gray-500">Step 1: Select Room</span>
              <select
                value={locationPath[0] || ''}
                onChange={(e) => handlePathChange(1, e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500/50"
              >
                <option value="" disabled>-- Select Room --</option>
                {getOptionsForDepth(0).map(node => (
                  <option key={node.id} value={node.id}>
                    {node.icon} {node.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Render recursive sub-dropdowns based on locationPath length */}
            {locationPath.map((selectedId, idx) => {
              const childOptions = getOptionsForDepth(idx + 1);
              if (childOptions.length === 0) return null;

              return (
                <div key={idx} className="flex flex-col gap-1 animate-slide-up">
                  <span className="text-[10px] font-semibold text-gray-500">
                    Step {idx + 2}: Mapped Location (under {nodes.find(n => n.id === selectedId)?.name})
                  </span>
                  <select
                    value={locationPath[idx + 1] || ''}
                    onChange={(e) => handlePathChange(idx + 2, e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="">-- Placed Here --</option>
                    {childOptions.map(node => (
                      <option key={node.id} value={node.id}>
                        {node.icon} {node.name} ({node.type})
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {/* Quick Location Creator Modal-within-form */}
          {showQuickLocationForm && (
            <div className="p-3 bg-slate-950 rounded-xl border border-gray-800 flex flex-col gap-3.5 animate-slide-up mt-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-pink-400">
                Create Space Inside: {currentLeafNode ? `${currentLeafNode.icon} ${currentLeafNode.name}` : 'Home (Root)'}
              </h4>
              
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Closet, Lockbox, Desk Drawer"
                  value={quickLocationName}
                  onChange={(e) => setQuickLocationName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-pink-500/50"
                />

                <select
                  value={quickLocationType}
                  onChange={(e) => setQuickLocationType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-pink-500/50"
                >
                  <option value="furniture">Furniture</option>
                  <option value="cabinet">Cabinet</option>
                  <option value="shelf">Shelf</option>
                  <option value="drawer">Drawer</option>
                  <option value="box">Box/Bag</option>
                  <option value="other">Other/Custom</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickLocationForm(false);
                    setQuickLocationName('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-gray-800 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateQuickLocation}
                  disabled={!quickLocationName.trim()}
                  className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold disabled:opacity-50"
                >
                  Add Zone
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notes, Photo & Tags */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Additional details</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Photo</label>
            <div className="flex items-center gap-3">
              <label className="w-16 h-16 rounded-xl border border-dashed border-gray-800 hover:border-indigo-500/40 flex flex-col items-center justify-center text-gray-500 cursor-pointer bg-slate-900/40 overflow-hidden relative active:scale-95 transition-all">
                {photo ? (
                  <img src={photo} alt="Item Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              <div className="flex flex-col">
                <span className="text-xs text-gray-300 font-semibold">{photo ? 'Photo added' : 'No photo uploaded'}</span>
                <span className="text-[10px] text-gray-500 mt-0.5">Click box to upload or snap photo</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Rechargeable, keep away from water, expiry code inside..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. power, alkaline, cell, charger"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Expiry Date (Optional)</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-98 transition-all cursor-pointer"
        >
          {isEditing ? 'Save Changes' : 'Add Item to inventory'}
        </button>
      </form>
    </div>
  );
};
