import React, { useState, useEffect, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { ArrowLeft, Camera, Navigation, Compass, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

interface GuideStep {
  distance: number;
  instruction: string;
  direction: 'forward' | 'right' | 'left' | 'down' | 'here';
  boxLabel: string;
}

export const VisualLocation: React.FC = () => {
  const { selectedThingIdForAR, things, nodes, setView, selectThingForAR } = useInventory();
  const thing = things.find(t => t.id === selectedThingIdForAR);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [findingState, setFindingState] = useState<'idle' | 'scanning' | 'navigating' | 'found'>('idle');
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [distance, setDistance] = useState(2.4);
  const videoRef = useRef<HTMLVideoElement>(null);

  const roomNode = thing ? nodes.find(n => n.id === thing.locationPath[0]) : null;
  const leafNode = thing ? nodes.find(n => n.id === thing.locationPath[thing.locationPath.length - 1]) : null;

  const currentStepNodeId = thing ? thing.locationPath[currentStepIdx] : null;
  const currentStepNode = currentStepNodeId ? nodes.find(n => n.id === currentStepNodeId) : null;
  const currentStepPhoto = currentStepNode ? currentStepNode.photo : null;

  // Set up AR guidance steps
  const guidanceSteps: GuideStep[] = [
    { 
      distance: 2.4, 
      instruction: `Enter the ${roomNode?.name || 'room'} and face the main storage area.`, 
      direction: 'forward',
      boxLabel: roomNode?.name || 'Room' 
    },
    { 
      distance: 1.8, 
      instruction: `Walk towards the ${nodes.find(n => n.id === thing?.locationPath[1])?.name || 'cabinet'}. Turn slightly right.`, 
      direction: 'right',
      boxLabel: nodes.find(n => n.id === thing?.locationPath[1])?.name || 'Storage'
    },
    { 
      distance: 1.1, 
      instruction: `Locate the ${nodes.find(n => n.id === thing?.locationPath[2])?.name || 'drawer'}. Open it.`, 
      direction: 'forward',
      boxLabel: nodes.find(n => n.id === thing?.locationPath[2])?.name || 'Drawer'
    },
    { 
      distance: 0.4, 
      instruction: `Look inside the ${leafNode?.name || 'box'}.`, 
      direction: 'down',
      boxLabel: leafNode?.name || 'Box'
    },
    { 
      distance: 0.1, 
      instruction: `Found it! ${thing?.name} is highlighted inside.`, 
      direction: 'here',
      boxLabel: thing?.name || 'Item'
    }
  ];

  // Enable/Disable Camera
  useEffect(() => {
    let active = true;
    async function startCamera() {
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
        console.warn("Rear camera not accessible, falling back to simulation.", err);
        if (active) setCameraError(true);
      }
    }

    startCamera();

    return () => {
      active = false;
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Timer simulation during interactive navigation
  useEffect(() => {
    if (findingState !== 'navigating') return;

    const interval = setInterval(() => {
      setCurrentStepIdx(prev => {
        const next = prev + 1;
        if (next >= guidanceSteps.length) {
          setFindingState('found');
          setDistance(0.1);
          clearInterval(interval);
          return prev;
        }
        setDistance(guidanceSteps[next].distance);
        return next;
      });
    }, 2500); // Progress step every 2.5s

    return () => clearInterval(interval);
  }, [findingState]);

  if (!thing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center gap-3 h-[400px]">
        <AlertTriangle className="w-10 h-10 text-rose-500 animate-bounce" />
        <h3 className="text-sm font-bold text-white">No item selected</h3>
        <button onClick={() => setView('ask')} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
          Back to Search
        </button>
      </div>
    );
  }

  const activeStep = guidanceSteps[currentStepIdx];

  const handleStartFinding = () => {
    setFindingState('navigating');
    setCurrentStepIdx(0);
    setDistance(guidanceSteps[0].distance);
  };

  const handleReset = () => {
    setFindingState('idle');
    setCurrentStepIdx(0);
    setDistance(guidanceSteps[0].distance);
  };

  const handleBack = () => {
    selectThingForAR(null);
    setView('ask');
  };

  return (
    <div className="relative w-full h-[650px] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
      
      {/* 1. Camera Feed / Simulated Viewport */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className={`absolute inset-0 w-full h-full object-cover z-0 ${cameraStream && !cameraError ? '' : 'hidden'}`}
      />
      {(!cameraStream || cameraError) && (
        /* Animated simulation backdrop */
        <div className="absolute inset-0 bg-[#0c1020] flex items-center justify-center overflow-hidden z-0">
          {/* Spatial Grid Backdrop */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          {/* Simulated scan line */}
          <div className="absolute left-0 w-full h-0.5 bg-indigo-500/35 scan-line z-10 shadow-lg shadow-indigo-500/40"></div>

          {/* Floating mock spatial points */}
          <div className="absolute w-4 h-4 bg-indigo-500/30 border border-indigo-500 rounded-full animate-ping top-[30%] left-[20%]"></div>
          <div className="absolute w-3 h-3 bg-pink-500/30 border border-pink-500 rounded-full animate-ping top-[55%] right-[25%]" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute w-2 h-2 bg-indigo-500/40 rounded-full top-[45%] left-[65%]"></div>
          <div className="absolute w-1.5 h-1.5 bg-pink-500/40 rounded-full top-[25%] right-[45%]"></div>

          {/* Simulated Wireframe boxes representing furniture scan */}
          <div className="absolute w-44 h-28 border border-white/5 bg-white/[0.01] rounded-2xl rotate-3 top-[32%] left-[10%] flex items-center justify-center">
            <span className="text-[9px] text-white/10 uppercase tracking-widest font-mono">SIM_CABINET_MESH</span>
          </div>
          <div className="absolute w-36 h-20 border border-white/5 bg-white/[0.01] rounded-2xl -rotate-6 bottom-[30%] right-[10%] flex items-center justify-center">
            <span className="text-[9px] text-white/10 uppercase tracking-widest font-mono">SIM_DRAWER_MESH</span>
          </div>
        </div>
      )}

      {/* AR HUD OVERLAYS */}

      {/* Floating Header */}
      <div className="relative z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={handleBack}
          className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        
        <div className="text-center">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono drop-shadow">
            Spatial Guide
          </h3>
          <span className="text-[10px] text-indigo-400 font-semibold uppercase drop-shadow mt-0.5 block">
            {thing.name} Finder
          </span>
        </div>

        <div className="w-8 h-8 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
          <Compass className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      </div>

      {/* Camera Mapping Photo Picture-In-Picture Overlay */}
      {currentStepPhoto && (
        <div className="absolute top-20 right-4 w-28 h-20 rounded-xl border border-white/20 bg-black/60 p-1 backdrop-blur-md z-20 flex flex-col gap-1 shadow-lg animate-slide-up">
          <img src={currentStepPhoto} alt="Cabinet Target" className="w-full h-full object-cover rounded-lg" />
          <span className="text-[8px] font-bold text-white text-center uppercase tracking-widest leading-none mt-0.5">Photo Map</span>
        </div>
      )}

      {/* Bounding Box AR Overlay */}
      {findingState !== 'found' && (
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            {/* Top Tag indicator */}
            <div className="px-2.5 py-1 rounded bg-indigo-600/90 text-white font-extrabold text-[10px] uppercase tracking-wider shadow shadow-indigo-600/20">
              {thing.name.toUpperCase()} ({activeStep.boxLabel})
            </div>

            {/* Bounding Box brackets */}
            <div className="w-40 h-28 border-2 border-indigo-500 rounded-lg flex items-center justify-center relative animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              {/* Corner brackets details */}
              <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white"></span>
              <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white"></span>
              <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white"></span>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white"></span>
              
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[14px] text-white font-extrabold drop-shadow">
                  {distance.toFixed(1)} m
                </span>
                <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider">
                  away
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS OVERLAY */}
      {findingState === 'found' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4 animate-slide-up bg-black/35 backdrop-blur-[2px]">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <div className="text-center px-6">
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Mil gaya! 🎉</h2>
            <p className="text-xs text-gray-300 mt-2">
              Batteries reached. Look inside the <span className="text-indigo-400 font-bold">{leafNode?.name || 'box'}</span> inside the {nodes.find(n => n.id === thing.locationPath[1])?.name}.
            </p>
          </div>
        </div>
      )}

      {/* Floating Instructions & Control Panel */}
      <div className="relative z-10 p-5 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-4">
        
        {/* Navigation Info Bar */}
        {/* Navigation Info Bar */}
        {findingState !== 'idle' && (
          <div className="p-3 bg-white/[0.04] backdrop-blur-md rounded-2xl border border-white/5 flex items-center gap-3.5">
            {/* Pulsing direction arrow icon */}
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow">
              <Navigation className={`w-5 h-5 transition-transform duration-300 ${
                activeStep.direction === 'right' ? 'rotate-90' : 
                activeStep.direction === 'left' ? '-rotate-90' : 
                activeStep.direction === 'down' ? 'rotate-180' : ''
              }`} />
            </div>
            <div className="flex-1">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block leading-none mb-1">
                Active Guidance
              </span>
              <p className="text-[12px] font-bold text-white leading-snug">
                {activeStep.instruction}
              </p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          {findingState === 'idle' && (
            <button
              onClick={handleStartFinding}
              className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" /> Start Finding (AR)
            </button>
          )}

          {findingState === 'navigating' && (
            <div className="flex-1 py-3.5 text-center bg-indigo-950/20 border border-indigo-500/20 rounded-2xl text-xs font-bold text-indigo-400 tracking-wide pulse-glow">
              🧭 Autopilot Guidance Active... Move closer
            </div>
          )}

          {findingState === 'found' && (
            <div className="w-full flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-gray-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <button
                onClick={handleBack}
                className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md shadow-indigo-600/10"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
