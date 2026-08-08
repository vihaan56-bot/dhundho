import React, { useState, useEffect, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import type { Thing } from '../types';
import { Search, Mic, MicOff, MapPin, Edit, Sparkles, AlertCircle } from 'lucide-react';

export const AskDhundho: React.FC = () => {
  const { 
    searchThings, 
    addSearchHistory, 
    getLocationNodeList, 
    getLocationPathString,
    setView, 
    selectThingForAR,
    incrementSearchCount 
  } = useInventory();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ thing: Thing; score: number }[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Check for dashboard clicked query on mount
  useEffect(() => {
    const pendingQuery = localStorage.getItem('dhundho_pending_query');
    if (pendingQuery) {
      setQuery(pendingQuery);
      executeSearch(pendingQuery);
      localStorage.removeItem('dhundho_pending_query');
    }
  }, []);

  // Set up Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN'; // Optimized for Indian English/Hindi transliterations
      
      rec.onstart = () => {
        setIsListening(true);
      };
      
      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        executeSearch(transcript);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported on this browser. Try Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const executeSearch = (searchVal: string) => {
    if (!searchVal.trim()) return;
    addSearchHistory(searchVal);
    const searchResults = searchThings(searchVal);
    setResults(searchResults);
    setHasSearched(true);
    
    // If we matched a top-scoring item, increment its search frequency
    if (searchResults.length > 0) {
      incrementSearchCount(searchResults[0].thing.id);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleShowLocation = (thingId: string) => {
    selectThingForAR(thingId);
    setView('ar');
  };

  const handleEditThing = (thingId: string) => {
    // Open edit screen (AddThing component handles edit mode)
    // We can set a local storage trigger or a context state.
    localStorage.setItem('dhundho_editing_thing_id', thingId);
    setView('add');
  };

  // Find best match if any
  const bestMatch = results.length > 0 ? results[0] : null;
  const secondaryMatches = results.length > 1 ? results.slice(1) : [];

  return (
    <div className="flex flex-col gap-5 pb-6 animate-slide-up">
      {/* Title */}
      <div className="px-1">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" /> Ask Dhundho
        </h2>
        <p className="text-xs text-gray-400 font-medium">
          Ask in English or Hindi (e.g. “where is my passport?” or “chawal kahan hai?”)
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="w-full pl-4 pr-11 py-3.5 rounded-2xl bg-slate-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500/50"
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all cursor-pointer ${
              isListening 
                ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/30' 
                : 'text-indigo-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          className="px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Listening Wave Overlay (if listening) */}
      {isListening && (
        <div className="glass-panel rounded-2xl p-5 text-center flex flex-col items-center gap-3 animate-pulse border-red-500/20">
          <div className="flex gap-1.5 justify-center items-center h-8">
            <span className="w-1 bg-red-500 h-4 rounded animate-bounce" style={{ animationDelay: '0.1s' }}></span>
            <span className="w-1 bg-red-500 h-8 rounded animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-1 bg-red-500 h-6 rounded animate-bounce" style={{ animationDelay: '0.3s' }}></span>
            <span className="w-1 bg-red-500 h-8 rounded animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            <span className="w-1 bg-red-500 h-3 rounded animate-bounce" style={{ animationDelay: '0.5s' }}></span>
          </div>
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Listening... Speak now</p>
        </div>
      )}

      {/* Results View */}
      {hasSearched && (
        <div className="flex flex-col gap-4 animate-slide-up">
          
          {/* Best Match */}
          {bestMatch ? (
            <div className="flex flex-col gap-3">
              <div className="text-center py-1">
                <span className="text-emerald-400 font-extrabold text-sm flex items-center justify-center gap-1.5">
                  Mil gaya! 🎉
                </span>
              </div>

              {/* Found Item Detail Card */}
              <div className="glass-panel rounded-2xl p-5 border-emerald-500/20 shadow-lg relative overflow-hidden">
                {/* Background watermarked visual details */}
                <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-600/5 rounded-full blur-2xl"></div>
                
                {/* Name & Category */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-extrabold text-white leading-tight">
                      {bestMatch.thing.name}
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mt-1 block">
                      {bestMatch.thing.category}
                    </span>
                  </div>

                  {bestMatch.thing.photo && (
                    <img 
                      src={bestMatch.thing.photo} 
                      alt={bestMatch.thing.name} 
                      className="w-12 h-12 rounded-xl object-cover border border-white/10"
                    />
                  )}
                </div>

                {/* Hierarchical Location Path (Visual Dropdown Chain) */}
                <div className="mt-5 bg-slate-950/40 p-4 rounded-xl border border-white/5">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2.5">
                    Location Hierarchy
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {getLocationNodeList(bestMatch.thing).map((node, index, arr) => (
                      <div key={node.id} className="flex items-center gap-2 text-xs">
                        <div className="w-6 h-6 rounded-lg bg-indigo-950/30 flex items-center justify-center border border-white/5">
                          {node.icon}
                        </div>
                        <span className={`font-bold ${index === arr.length - 1 ? 'text-white' : 'text-gray-400'}`}>
                          {node.name}
                        </span>
                        {index < arr.length - 1 && (
                          <span className="text-[9px] text-gray-600">({node.type})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details Footer */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs border-t border-white/5 pt-4 text-gray-400 font-medium">
                  <div>
                    Quantity: <span className="text-white font-bold">{bestMatch.thing.quantity}</span>
                  </div>
                  {bestMatch.thing.expiryDate && (
                    <div>
                      Expiry: <span className="text-rose-400 font-bold">{bestMatch.thing.expiryDate}</span>
                    </div>
                  )}
                  {bestMatch.thing.notes && (
                    <div className="col-span-2 text-[11px] text-gray-500 italic mt-1 leading-relaxed">
                      💡 Notes: {bestMatch.thing.notes}
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => handleShowLocation(bestMatch.thing.id)}
                    className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-indigo-600/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer glow-btn"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Show Location
                  </button>
                  
                  <button
                    onClick={() => handleEditThing(bestMatch.thing.id)}
                    className="p-3 rounded-xl bg-slate-900 border border-gray-800 text-gray-400 hover:text-white active:scale-95 transition-all cursor-pointer"
                    title="Edit Item"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // No Match state
            <div className="glass-panel rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-9 h-9 text-indigo-500/80 animate-bounce" />
              <h3 className="text-base font-extrabold text-white">“Koi cheez dhoondh rahe ho?”</h3>
              <p className="text-xs text-gray-400 max-w-[250px] leading-relaxed">
                We couldn't find matches for <span className="text-indigo-400 font-semibold">“{query}”</span>. Bas poochho, Dhundho yaad rakhta hai.
              </p>
              
              <button
                onClick={() => setView('add')}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                Add it now
              </button>
            </div>
          )}

          {/* Secondary Matches (Did you mean...?) */}
          {secondaryMatches.length > 0 && (
            <div className="flex flex-col gap-2.5 mt-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">
                Other possible matches
              </span>
              <div className="flex flex-col gap-2">
                {secondaryMatches.map(({ thing }) => (
                  <div
                    key={thing.id}
                    onClick={() => {
                      // Set query to this match and re-trigger
                      setQuery(thing.name);
                      executeSearch(thing.name);
                    }}
                    className="glass-panel rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-indigo-500/25 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {thing.name}
                      </span>
                      <span className="text-[9px] text-gray-400">
                        in {getLocationPathString(thing).split(' → ').slice(-1)[0]}
                      </span>
                    </div>
                    <MapPin className="w-3.5 h-3.5 text-gray-600 group-hover:text-indigo-400 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Search Helper Prompts (when empty) */}
      {!hasSearched && (
        <div className="flex flex-col gap-3 mt-4">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">
            Try asking things like:
          </span>
          <div className="flex flex-col gap-2">
            {[
              'where is my passport?',
              'TV Remote kaha hai?',
              'find batteries',
              'rice folder location'
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => {
                  setQuery(prompt);
                  executeSearch(prompt);
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-gray-900 hover:border-gray-800/80 text-xs text-gray-300 font-medium transition-all flex items-center justify-between group cursor-pointer"
              >
                <span>“{prompt}”</span>
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Ask →</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
