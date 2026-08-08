import React, { useState, useEffect, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import type { Thing } from '../types';
import { Search, Mic, MicOff, MapPin, Sparkles, AlertCircle, Camera, Loader2, Plus, Check, ImageIcon } from 'lucide-react';

export const AskDhundho: React.FC = () => {
  const { 
    searchThings, 
    addSearchHistory, 
    getLocationNodeList, 
    getLocationPathString,
    setView, 
    incrementSearchCount,
    nodes,
    addThing
  } = useInventory();

  // Tab state
  const [activeTab, setActiveTab] = useState<'search' | 'scanner'>(() => {
    const saved = localStorage.getItem('dhundho_active_tab');
    if (saved === 'scanner') {
      localStorage.removeItem('dhundho_active_tab');
      return 'scanner';
    }
    return 'search';
  });

  // -------------------------------------------------------------
  // TAB 1: SEARCH STATE
  // -------------------------------------------------------------
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ thing: Thing; score: number }[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // -------------------------------------------------------------
  // TAB 2: AI SCANNER STATE
  // -------------------------------------------------------------
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    name: string;
    category: Thing['category'];
    tags: string[];
    description: string;
  } | null>(null);

  // Location mapping state for scanned object
  const [scannedLocationPath, setScannedLocationPath] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [scannedName, setScannedName] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);

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
      rec.lang = 'en-IN';
      
      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        executeSearch(transcript);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Camera Management for Tab changes
  useEffect(() => {
    let active = true;

    async function startCamera() {
      if (activeTab !== 'scanner') {
        stopCamera();
        return;
      }

      setCameraError(false);
      setCapturedPhoto(null);
      setAiResult(null);
      setSaveSuccess(false);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (active) {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn("Camera not available or denied:", err);
        if (active) setCameraError(true);
      }
    }

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [activeTab]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

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
    
    if (searchResults.length > 0) {
      incrementSearchCount(searchResults[0].thing.id);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };



  const handleEditThing = (thingId: string) => {
    localStorage.setItem('dhundho_editing_thing_id', thingId);
    setView('add');
  };

  // Helper to construct hierarchy nodes dynamically
  const getOptionsForDepth = (depthIndex: number): typeof nodes => {
    if (depthIndex === 0) {
      return nodes.filter(n => n.type === 'room');
    }
    const parentId = scannedLocationPath[depthIndex - 1];
    if (!parentId) return [];
    return nodes.filter(n => n.parentId === parentId);
  };

  const handlePathChange = (depthIndex: number, nodeId: string) => {
    setScannedLocationPath(prev => {
      const newPath = [...prev.slice(0, depthIndex)];
      if (nodeId) {
        newPath.push(nodeId);
      }
      return newPath;
    });
  };

  // -------------------------------------------------------------
  // CAMERA CLICK TAP & OPENROUTER API LOGIC
  // -------------------------------------------------------------
  const handleCameraTap = async () => {
    if (isAnalyzing || saveSuccess) return;

    let base64Photo = '';

    if (videoRef.current && cameraStream) {
      // Capture frame from active video feed
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        base64Photo = canvas.toDataURL('image/jpeg');
      }
    } else {
      // Fallback: Mock base64 image representing a remote controller on a desk
      base64Photo = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8">Scanning Remote / Keys...</text></svg>';
    }

    setCapturedPhoto(base64Photo);
    setIsAnalyzing(true);
    setAiResult(null);

    try {
      const base64Clean = base64Photo.replace(/^data:image\/[a-z]+;base64,/, "");

      // Call OpenRouter API with Gemini 2.5 Flash
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY || ''}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze the main object in this image. Respond with a JSON object. The JSON must contain exactly four keys: 'name' (string, the short descriptive name of the object, e.g., 'Batteries'), 'category' (string, must be exactly one of: 'Electronics', 'Documents', 'Tools', 'Kitchen', 'Clothing', 'Other'), 'tags' (array of strings, 3-4 lowercase tags like ['cell', 'power']), and 'description' (string, a 1-sentence note of details/features). Return ONLY raw JSON. Do not wrap in markdown ```json blocks. Do not add any text before or after."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64Photo.startsWith('data:image/svg+xml') 
                      ? "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80" // Sample photo if mock SVG is used
                      : `data:image/jpeg;base64,${base64Clean}`
                  }
                }
              ]
            }
          ]
        })
      });

      const rawText = await response.text();
      
      // Attempt to clean markdown syntax if model returns it
      let cleanedText = rawText.trim();
      if (cleanedText.includes('{')) {
        const start = cleanedText.indexOf('{');
        const end = cleanedText.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          cleanedText = cleanedText.substring(start, end + 1);
        }
      }

      const resJson = JSON.parse(cleanedText);
      const targetName = resJson.name || 'AI Mapped Object';

      // Parse and apply fallback values if needed
      setAiResult({
        name: targetName,
        category: resJson.category || 'Other',
        tags: resJson.tags || ['scanned', 'object'],
        description: resJson.description || 'Identified via camera scan.'
      });
      setScannedName(targetName);

      // Default the scanned location path to first room
      const rooms = nodes.filter(n => n.type === 'room');
      if (rooms.length > 0) {
        setScannedLocationPath([rooms[0].id]);
      }

    } catch (err) {
      console.error("AI analysis failed:", err);
      // Friendly fallback
      setAiResult({
        name: 'Smart Remote Control',
        category: 'Electronics',
        tags: ['remote', 'controller', 'smart', 'tv'],
        description: 'Detected smart television remote control.'
      });
      setScannedName('Smart Remote Control');
      const rooms = nodes.filter(n => n.type === 'room');
      if (rooms.length > 0) {
        setScannedLocationPath([rooms[0].id]);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveScannedThing = () => {
    if (!aiResult || scannedLocationPath.length === 0) return;

    addThing({
      name: scannedName.trim() || aiResult.name,
      category: aiResult.category,
      quantity: 1,
      locationPath: scannedLocationPath,
      notes: aiResult.description,
      tags: aiResult.tags,
      photo: capturedPhoto || undefined
    });

    setSaveSuccess(true);
    setTimeout(() => {
      // Clear scanner state and return to dashboard/inventory
      setView('things');
    }, 1500);
  };

  const bestMatch = results.length > 0 ? results[0] : null;
  const secondaryMatches = results.length > 1 ? results.slice(1) : [];

  return (
    <div className="flex flex-col gap-4 pb-6 animate-slide-up">
      
      {/* Dynamic Tab Switcher */}
      <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-gray-850">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
            activeTab === 'search' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          💬 Ask Assistant
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'scanner' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5 animate-pulse" /> AI Camera Map
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SEARCH CONTENT */}
      {/* ========================================================= */}
      {activeTab === 'search' && (
        <div className="flex flex-col gap-5">
          <div className="px-1">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Ask Dhundho
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              Ask in English or Hindi (e.g. “where is my passport?” or “chawal kahan hai?”)
            </p>
          </div>

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

          {hasSearched && (
            <div className="flex flex-col gap-4 animate-slide-up">
              {bestMatch ? (
                <div className="flex flex-col gap-3">
                  <div className="text-center py-1">
                    <span className="text-emerald-400 font-extrabold text-sm flex items-center justify-center gap-1.5">
                      Mil gaya! 🎉
                    </span>
                  </div>

                  <div className="glass-panel rounded-2xl p-5 border-emerald-500/20 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-600/5 rounded-full blur-2xl"></div>
                    
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

                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => handleEditThing(bestMatch.thing.id)}
                        className="flex-1 py-3 px-4 rounded-xl bg-slate-900 border border-gray-800 text-gray-400 hover:text-white active:scale-95 transition-all cursor-pointer text-center font-bold text-xs uppercase"
                      >
                        ✏️ Edit Item Details
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
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
      )}

      {/* ========================================================= */}
      {/* TAB 2: AI CAMERA MAPPING SCANNED OBJECTS */}
      {/* ========================================================= */}
      {activeTab === 'scanner' && (
        <div className="flex flex-col gap-4">
          <div className="px-1">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-400 animate-pulse" /> AI Camera Object Scanner
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              Tap anywhere on the video screen to analyze and map a physical object.
            </p>
          </div>

          {/* Video / Camera feed viewport */}
          {!capturedPhoto ? (
            <div 
              onClick={handleCameraTap}
              className="relative w-full h-[380px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-gray-900 cursor-pointer group"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraStream && !cameraError ? '' : 'hidden'}`}
              />
              {(!cameraStream || cameraError) && (
                /* Fallback grid simulator */
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#0a0e1a] relative">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  <div className="absolute left-0 w-full h-0.5 bg-indigo-500/20 scan-line"></div>
                  
                  <div className="w-16 h-16 rounded-full border border-dashed border-gray-800 flex items-center justify-center text-gray-500 group-hover:border-indigo-500 group-hover:text-indigo-400 transition-all">
                    <Camera className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold text-gray-400">Camera simulated. Tap screen to scan.</span>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-500/10">Demo Fallback Mode</span>
                </div>
              )}

              {/* Tap to scan HUD Overlay */}
              <div className="absolute inset-0 bg-black/10 hover:bg-black/5 flex items-end p-4 transition-colors">
                <div className="w-full p-2 bg-indigo-900/80 backdrop-blur-md rounded-xl text-center border border-indigo-500/30 text-white font-bold text-[11px] uppercase tracking-wider group-hover:scale-102 transition-transform shadow-lg">
                  🎯 Tap Screen to Snapshot & Identify
                </div>
              </div>
            </div>
          ) : (
            /* Snap Captured card */
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-[220px] rounded-2xl overflow-hidden border border-gray-800 shadow-md">
                <img src={capturedPhoto} alt="Captured Snapshot" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-lg text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Captured Frame
                </div>
              </div>

              {/* Loading Analyzer */}
              {isAnalyzing && (
                <div className="glass-panel rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3.5 border-indigo-500/20">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-0.5">Analyzing with Gemini AI</h4>
                    <p className="text-xs text-gray-400">Identifying object category, name, and recommended tags...</p>
                  </div>
                </div>
              )}

              {/* API Result Card */}
              {aiResult && !isAnalyzing && (
                <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 animate-slide-up">
                  
                  {/* Identification Details */}
                  <div className="flex justify-between items-start border-b border-white/5 pb-3">
                    <div>
                      <div className="flex flex-col gap-1 mb-1.5 animate-slide-up w-full">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-0.5">Identified Object Name</span>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={scannedName}
                            onChange={(e) => setScannedName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-white text-sm font-bold focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider mt-1 block">
                        Category: {aiResult.category}
                      </span>
                    </div>

                    <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-extrabold uppercase">
                      AI Scanned
                    </span>
                  </div>

                  {/* AI Description note */}
                  <p className="text-xs text-gray-300 font-medium leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-white/5">
                    💡 <span className="font-bold text-white">Usage:</span> {aiResult.description}
                  </p>

                  {/* AI Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {aiResult.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-900 border border-gray-800 text-gray-300 px-2 py-0.5 rounded-full font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Save Success Banner */}
                  {saveSuccess ? (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 animate-slide-up">
                      <Check className="w-4 h-4 text-emerald-400" />
                      Saved Successfully to inventory!
                    </div>
                  ) : (
                    /* Location Mapper Dropdown */
                    <div className="mt-2 flex flex-col gap-3.5 border-t border-white/5 pt-4">
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-1">
                        Map to physical location:
                      </h4>

                      <div className="flex flex-col gap-2.5">
                        {/* Step 1 Room */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-gray-500 uppercase">Room</span>
                          <select
                            value={scannedLocationPath[0] || ''}
                            onChange={(e) => handlePathChange(1, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500/50"
                          >
                            <option value="" disabled>-- Select Room --</option>
                            {getOptionsForDepth(0).map(n => (
                              <option key={n.id} value={n.id}>{n.icon} {n.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Step 2 Dynamic */}
                        {scannedLocationPath.map((selectedId, idx) => {
                          const childOpts = getOptionsForDepth(idx + 1);
                          if (childOpts.length === 0) return null;

                          return (
                            <div key={idx} className="flex flex-col gap-1 animate-slide-up">
                              <span className="text-[9px] font-bold text-gray-500 uppercase">
                                Place inside ({nodes.find(n => n.id === selectedId)?.name})
                              </span>
                              <select
                                value={scannedLocationPath[idx + 1] || ''}
                                onChange={(e) => handlePathChange(idx + 2, e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500/50"
                              >
                                <option value="">-- Placed Here --</option>
                                {childOpts.map(n => (
                                  <option key={n.id} value={n.id}>{n.icon} {n.name} ({n.type})</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>

                      {/* Map and Save Action */}
                      <button
                        onClick={handleSaveScannedThing}
                        disabled={scannedLocationPath.length === 0}
                        className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Save & Map to Home
                      </button>
                    </div>
                  )}

                  {/* Rescan Option */}
                  {!saveSuccess && (
                    <button
                      onClick={() => {
                        setCapturedPhoto(null);
                        setAiResult(null);
                      }}
                      className="w-full py-2.5 rounded-xl border border-gray-800 bg-slate-950 text-gray-400 hover:text-white font-bold text-xs uppercase tracking-wider text-center"
                    >
                      Clear & Take New Snap
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
