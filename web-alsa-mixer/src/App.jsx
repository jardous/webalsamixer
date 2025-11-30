import React, { useState, useEffect } from 'react';
import { Volume2, Mic, Settings, Sliders, Info, Power, ChevronDown, RefreshCw } from 'lucide-react';

// --- MOCK DATA FOR PREVIEW/SIMULATION MODE ---
const MOCK_CONTROLS = [
  { id: 'master', name: 'Master', type: 'INT', value: 75, min: 0, max: 100, isMuted: false, icon: 'speaker' },
  { id: 'headphone', name: 'Headphone', type: 'INT', value: 40, min: 0, max: 100, isMuted: false, icon: 'headphone' },
  { id: 'pcm', name: 'PCM', type: 'INT', value: 90, min: 0, max: 100, isMuted: false, icon: 'chip' },
  { id: 'mic', name: 'Mic Boost', type: 'INT', value: 20, min: 0, max: 3, isMuted: true, icon: 'mic' },
];

// --- HELPER TO GET DYNAMIC BACKEND URL ---
// This ensures it works whether you use localhost, 192.168.x.x, or pipedal.local
const getApiUrl = (endpoint) => {
  const host = window.location.hostname; // e.g., 'pipedal.local' or '192.168.1.50'
  return `http://${host}:5000/api${endpoint}`;
};

// --- COMPONENTS ---

const Header = ({ isConnected, onRetry }) => (
  <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-10">
    <div className="flex items-center gap-3">
      <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2 rounded-lg shadow-lg shadow-cyan-500/20">
        <Sliders className="text-white w-6 h-6" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">WebAlsa<span className="text-cyan-400">Mixer</span></h1>
        <div className="flex items-center gap-2">
           <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500'}`} />
           <p className="text-xs text-slate-400 font-mono">
             {isConnected ? 'Connected: hw:0' : 'Simulation Mode'}
           </p>
        </div>
      </div>
    </div>
    {!isConnected && (
      <button 
        onClick={onRetry}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-md transition-all border border-slate-700"
      >
        <RefreshCw className="w-3 h-3" />
        Retry Connection
      </button>
    )}
  </header>
);

const ControlCard = ({ control, onUpdate }) => {
  const isMuted = control.isMuted;
  
  // Handlers
  const handleSliderChange = (e) => {
    onUpdate(control.id, { value: parseInt(e.target.value) });
  };
  
  const handleMuteToggle = () => {
    onUpdate(control.id, { isMuted: !control.isMuted });
  };

  const handleSelectChange = (e) => {
    onUpdate(control.id, { value: e.target.value });
  };

  const handleBoolToggle = () => {
    onUpdate(control.id, { value: control.value === 1 ? 0 : 1 });
  };

  // Render Logic based on Type
  const renderInput = () => {
    if (control.type === 'ENUM') {
      return (
        <div className="relative">
          <select 
            value={control.value} 
            onChange={handleSelectChange}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-2 outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer hover:border-slate-600"
          >
            {control.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-2.5 pointer-events-none text-slate-500 w-4 h-4" />
        </div>
      );
    }

    if (control.type === 'BOOL') {
       return (
         <div className="flex items-center justify-between bg-slate-950 p-3 rounded-md border border-slate-800">
            <span className="text-slate-400 text-sm">{control.value === 1 ? 'Enabled' : 'Disabled'}</span>
            <button 
              onClick={handleBoolToggle}
              className={`relative w-11 h-6 rounded-full transition-colors ${control.value === 1 ? 'bg-cyan-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${control.value === 1 ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
         </div>
       );
    }

    // Default: INTEGER (Slider)
    const range = control.max - control.min;
    const percent = range === 0 ? 0 : ((control.value - control.min) / range) * 100;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-end">
           <span className={`text-2xl font-bold font-mono ${isMuted ? 'text-slate-600' : 'text-cyan-400'}`}>
             {control.value}
             <span className="text-xs text-slate-500 ml-1 font-sans">%</span>
           </span>
        </div>
        
        <div className="relative w-full h-6 flex items-center group">
          <div className="absolute w-full h-2 bg-slate-800 rounded-full overflow-hidden">
             <div 
               className={`h-full transition-all duration-100 ${isMuted ? 'bg-slate-600' : 'bg-cyan-500'}`} 
               style={{ width: `${percent}%` }}
             />
          </div>
          <input 
            type="range" 
            min={control.min} 
            max={control.max} 
            value={control.value} 
            onChange={handleSliderChange}
            className="absolute w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        
        <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase">
          <span>{control.min}</span>
          <span>dB Gain</span>
          <span>{control.max}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-slate-900 rounded-xl p-5 border transition-all duration-200 ${isMuted ? 'border-red-900/30 bg-red-900/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 hover:shadow-xl'}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isMuted ? 'bg-slate-800 text-slate-500' : 'bg-cyan-500/10 text-cyan-400'}`}>
            {control.icon === 'mic' ? <Mic size={20} /> : 
             control.icon === 'settings' ? <Settings size={20} /> :
             <Volume2 size={20} />}
          </div>
          <h3 className={`font-medium ${isMuted ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-200'}`}>{control.name}</h3>
        </div>
        
        {control.type !== 'BOOL' && (
           <button 
             onClick={handleMuteToggle}
             className={`p-2 rounded-md transition-colors ${isMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
             title={isMuted ? "Unmute" : "Mute"}
           >
             {isMuted ? <Power size={18} /> : <Power size={18} />}
           </button>
        )}
      </div>

      {renderInput()}
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [controls, setControls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchControls = async () => {
    setIsLoading(true);
    try {
      // DYNAMIC URL: Uses window.location.hostname to find the Pi
      const url = getApiUrl('/controls');
      const res = await fetch(url);
      
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setControls(data);
      setIsConnected(true);
    } catch (e) {
      console.log("Backend not found, falling back to mock data:", e);
      setControls(MOCK_CONTROLS);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchControls();
  }, [retryCount]);

  const handleControlUpdate = async (id, changes) => {
    // 1. Optimistic UI Update (Immediate feedback)
    setControls(prev => prev.map(c => 
      c.id === id ? { ...c, ...changes } : c
    ));

    // 2. Sync with Backend (if connected)
    if (isConnected) {
      try {
        const url = getApiUrl(`/controls/${id}`);
        await fetch(url, { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(changes)
        });
      } catch (error) {
        console.error("Failed to sync with backend:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      <Header isConnected={isConnected} onRetry={() => setRetryCount(c => c + 1)} />
      
      <main className="container mx-auto p-4 md:p-8 max-w-7xl">
        {!isConnected && !isLoading && (
          <div className="mb-8 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
             <Info size={18} className="shrink-0" />
             <div className="text-sm">
               <span className="font-semibold block mb-0.5">Simulation Mode Active</span>
               Backend not detected at <code className="bg-amber-500/20 px-1 rounded">{getApiUrl('/')}</code>. 
               <br/>Ensure <b>python3 app.py</b> is running in a separate terminal.
             </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {[1,2,3,4].map(i => (
               <div key={i} className="h-56 bg-slate-900/50 rounded-xl animate-pulse border border-slate-800" />
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {controls.map((control, idx) => (
              <ControlCard 
                key={control.id || idx} 
                control={control} 
                onUpdate={handleControlUpdate} 
              />
            ))}
          </div>
        )}
        
        {!isLoading && controls.length === 0 && (
          <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
             <div className="inline-flex bg-slate-800 p-4 rounded-full mb-4">
               <Sliders className="text-slate-500" size={32} />
             </div>
             <h3 className="text-slate-300 font-medium text-lg">No Controls Found</h3>
             <p className="text-slate-500 mt-1 max-w-sm mx-auto">
               The ALSA backend returned no mixer controls. Check your sound card configuration.
             </p>
          </div>
        )}
      </main>
    </div>
  );
}
