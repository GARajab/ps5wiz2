import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Disc, 
  Sliders, 
  Video, 
  ListChecks, 
  Play, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Settings, 
  FileText, 
  HelpCircle, 
  AlertTriangle, 
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Lock,
  Unlock,
  Info
} from 'lucide-react';
import { Tutorial, PS5ModelType } from './types';

export default function App() {
  // Wizard States
  const [model, setModel] = useState<PS5ModelType | null>(null);
  const [firmwareInput, setFirmwareInput] = useState<string>("4.03");
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [checkedRequirements, setCheckedRequirements] = useState<Record<string, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  // Database / Tutorials State
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Admin Mode States
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  
  // Tutorial Editing States
  const [editingTutorial, setEditingTutorial] = useState<Partial<Tutorial> | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Load tutorials from actual server API database
  const fetchTutorials = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tutorials');
      if (!response.ok) throw new Error('Failed to load tutorials database');
      const data = await response.json();
      setTutorials(data);
      setErrorMessage(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not load latest tutorials from server. Using local backup.");
      // Fallback
      setTutorials([
        {
          id: "ps5-umtx-kernel",
          name: "PS5 Kernel Exploit (UMTX / BD-JB / Webkit)",
          minFirmware: 1.00,
          maxFirmware: 4.51,
          ps5Model: "both",
          status: "Stable",
          difficulty: "Medium",
          youtubeId: "b-hWeq-G99s",
          description: "A full kernel exploit for firmwares 1.00 through 4.51. It uses a Webkit vulnerability (or the Blu-ray Disc Java exploit on Disc consoles) combined with the UMTX kernel exploit.",
          requirements: ["PS5 on firmware 4.51 or lower", "A PC or phone connected to same network", "An exFAT USB drive"],
          steps: ["Navigate to Network > Settings", "Set DNS to Manual Primary 192.241.116.141", "Open User's Guide to run the exploit"]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
  }, []);

  // Helper to extract YouTube video ID from various formats
  const extractYoutubeId = (urlOrId: string): string => {
    if (!urlOrId) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlOrId.match(regExp);
    return (match && match[2].length === 11) ? match[2] : urlOrId;
  };

  // Find appropriate tutorial based on wizard choices
  const getMatchedTutorial = (): Tutorial | null => {
    if (!model) return null;
    const firmwareNum = parseFloat(firmwareInput);
    if (isNaN(firmwareNum)) return null;

    // Filter tutorials matching criteria
    const matched = tutorials.find(t => {
      const isModelCompatible = t.ps5Model === 'both' || t.ps5Model === model;
      const isFirmwareCompatible = firmwareNum >= t.minFirmware && firmwareNum <= t.maxFirmware;
      return isModelCompatible && isFirmwareCompatible;
    });

    return matched || null;
  };

  const matchedTutorial = getMatchedTutorial();

  // Handle Wizard Reset
  const handleReset = () => {
    setModel(null);
    setFirmwareInput("4.03");
    setCurrentStep(1);
    setCheckedRequirements({});
    setCheckedSteps({});
  };

  // Quick Firmware Presets
  const firmwarePresets = [
    { value: "2.00", label: "v2.00 (UMTX)", type: "low" },
    { value: "3.00", label: "v3.00 (UMTX)", type: "low" },
    { value: "4.03", label: "v4.03 (Recommended)", type: "low" },
    { value: "4.50", label: "v4.50 (UMTX)", type: "low" },
    { value: "4.51", label: "v4.51 (UMTX Limit)", type: "low" },
    { value: "5.00", label: "v5.00 (Mast1c0re)", type: "med" },
    { value: "7.00", label: "v7.00 (Mast1c0re)", type: "med" },
    { value: "7.61", label: "v7.61 (Mast1c0re Max)", type: "med" },
    { value: "8.20", label: "v8.20 (No Jailbreak)", type: "high" },
    { value: "11.00", label: "v11.00 (No Jailbreak)", type: "high" }
  ];

  // Admin Authentication (Simple password setup: 'Rajab@1954' for edit flow)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "Rajab@1954") {
      setIsAdminAuthenticated(true);
      setAdminAuthError(null);
      // Select first tutorial for editing by default if available
      if (tutorials.length > 0) {
        setEditingTutorial({ ...tutorials[0] });
      } else {
        setEditingTutorial({
          id: `ps5-custom-${Date.now()}`,
          name: "",
          minFirmware: 1.00,
          maxFirmware: 4.51,
          ps5Model: "both",
          status: "Stable",
          difficulty: "Medium",
          youtubeId: "",
          description: "",
          requirements: [""],
          steps: [""]
        });
      }
    } else {
      setAdminAuthError("Invalid Administrator Passcode. Please try again.");
    }
  };

  // Save/Update tutorial on actual JSON server
  const handleSaveTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTutorial) return;

    // Validate
    if (!editingTutorial.id || !editingTutorial.name) {
      alert("Please provide a Tutorial ID and Name");
      return;
    }

    try {
      const formattedTutorial = {
        ...editingTutorial,
        minFirmware: Number(editingTutorial.minFirmware || 1.00),
        maxFirmware: Number(editingTutorial.maxFirmware || 12.00),
        youtubeId: extractYoutubeId(editingTutorial.youtubeId || "")
      };

      const response = await fetch('/api/tutorials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedTutorial)
      });

      if (!response.ok) throw new Error('Server error updating tutorial database');

      const result = await response.json();
      
      // Update list
      await fetchTutorials();
      setIsCreatingNew(false);
      // Select the newly updated/created tutorial
      setEditingTutorial(result.data);
      alert("Tutorial database updated successfully!");
    } catch (err: any) {
      alert(`Error saving tutorial: ${err.message}`);
    }
  };

  // Delete tutorial from actual server
  const handleDeleteTutorial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tutorial from the database?")) return;

    try {
      const response = await fetch(`/api/tutorials/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete from server database');

      await fetchTutorials();
      if (tutorials.length > 0) {
        setEditingTutorial({ ...tutorials[0] });
      } else {
        setEditingTutorial(null);
      }
      alert("Tutorial removed from database.");
    } catch (err: any) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  // Admin dynamic form inputs modification helper
  const updateEditingField = (field: keyof Tutorial, value: any) => {
    if (!editingTutorial) return;
    setEditingTutorial(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Render difficulty rating badge
  const renderDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      "None": "bg-gray-100 text-gray-800 border-gray-200",
      "Easy": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      "Medium": "bg-amber-500/10 text-amber-400 border-amber-500/20",
      "Hard": "bg-rose-500/10 text-rose-400 border-rose-500/20"
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-mono font-medium rounded-full border ${colors[difficulty] || "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
        {difficulty} Difficulty
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col relative overflow-hidden">
      {/* Decorative background grid and neon glow */}
      <div className="absolute inset-0 tech-grid pointer-events-none opacity-30 z-0"></div>
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* Top Header Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/85 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleReset}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold tracking-tight text-lg text-white flex items-center gap-2">
                PS5 Jailbreak <span className="text-indigo-400 text-xs px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/25">Wizard</span>
              </h1>
              <p className="text-xs text-slate-400">Interactive Hack & Compatibility Guide</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                if (isAdminMode) {
                  // close editing state
                  setIsAdminAuthenticated(false);
                  setAdminPassword("");
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                isAdminMode 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
              }`}
            >
              <Settings className="h-3.5 w-3.5 animate-spin-slow" />
              <span>{isAdminMode ? "Exit Admin Mode" : "Admin Database Access"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 relative z-10 flex flex-col justify-start">
        
        {/* Error notification */}
        {errorMessage && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* -------------------- ADMIN MODE VIEW -------------------- */}
        {isAdminMode ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex-1 flex flex-col">
            
            {/* Admin Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="font-display font-semibold text-xl text-white flex items-center gap-2">
                  <Sliders className="text-amber-400 h-5 w-5" />
                  Jailbreak Tutorials Database Manager
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Add, edit and format tailored guides and update corresponding YouTube instructional clips seamlessly.
                </p>
              </div>
              <div className="mt-2 md:mt-0">
                <span className="text-xs bg-slate-950 px-3 py-1 rounded border border-slate-850 font-mono text-slate-400">
                  Storage Status: <span className="text-amber-400 font-bold">Local Server Database Connected</span>
                </span>
              </div>
            </div>

            {/* IF NOT AUTHENTICATED */}
            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto my-12 p-6 bg-slate-950/60 rounded-xl border border-slate-850 shadow-inner text-center">
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Administrator Verification</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  To modify or write tutorials directly onto the file system database, please enter the administrator passcode.
                </p>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      placeholder="Enter administrator code"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-sm text-center font-mono text-white placeholder-slate-600 focus:outline-none"
                      autoFocus
                    />
                    <p className="text-[10px] text-left text-slate-500 mt-1.5 text-center">
                      Tip: Use <span className="font-mono text-amber-500 font-semibold bg-slate-900 px-1 py-0.5 rounded">Rajab@1954</span> to access immediately.
                    </p>
                  </div>

                  {adminAuthError && (
                    <p className="text-xs text-rose-400 font-mono">{adminAuthError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2 rounded-lg transition-all"
                  >
                    Unlock Edit Panel
                  </button>
                </form>
              </div>
            ) : (
              /* IF AUTHENTICATED ADMIN PANEL */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-stretch">
                
                {/* Left Side: Tutorial selector list */}
                <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col max-h-[620px]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      Tutorials List ({tutorials.length})
                    </h3>
                    <button
                      onClick={() => {
                        setIsCreatingNew(true);
                        setEditingTutorial({
                          id: `ps5-jailbreak-${Date.now().toString().slice(-4)}`,
                          name: "New PS5 Jailbreak Tutorial",
                          minFirmware: 1.00,
                          maxFirmware: 12.00,
                          ps5Model: "both",
                          status: "New Method",
                          difficulty: "Medium",
                          youtubeId: "",
                          description: "",
                          requirements: ["A PS5 console", "High-speed Internet"],
                          steps: ["Ensure updates are turned off.", "Set up your environment."]
                        });
                      }}
                      className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add New</span>
                    </button>
                  </div>

                  <div className="overflow-y-auto space-y-2 flex-1 pr-1 no-scrollbar">
                    {tutorials.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setEditingTutorial({ ...item });
                          setIsCreatingNew(false);
                        }}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                          editingTutorial?.id === item.id && !isCreatingNew
                            ? "bg-slate-850 border-indigo-500 text-white shadow-md shadow-indigo-500/5"
                            : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 text-slate-300"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-mono text-indigo-400 font-semibold bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/30">
                            {item.ps5Model === 'both' ? 'All Models' : item.ps5Model === 'digital' ? 'Digital Only' : 'Disk Only'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            FW {item.minFirmware.toFixed(2)} - {item.maxFirmware.toFixed(2)}
                          </span>
                        </div>
                        <h4 className="font-semibold text-xs text-white truncate">{item.name}</h4>
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-850 text-[10px] text-slate-400">
                          <span className="text-amber-400">Difficulty: {item.difficulty}</span>
                          <span className="text-slate-500">ID: {item.id}</span>
                        </div>
                      </div>
                    ))}

                    {tutorials.length === 0 && (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        No tutorials currently in database. Click 'Add New' to insert.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Editorial fields */}
                <div className="lg:col-span-8 flex flex-col">
                  {editingTutorial ? (
                    <form onSubmit={handleSaveTutorial} className="bg-slate-950/30 border border-slate-850 rounded-xl p-5 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 no-scrollbar">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                          <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {isCreatingNew ? "CREATING NEW GUIDE" : "EDITING EXISTING GUIDE"}
                          </span>
                          {!isCreatingNew && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTutorial(editingTutorial.id!)}
                              className="text-rose-400 hover:text-rose-300 text-xs font-mono flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete from DB
                            </button>
                          )}
                        </div>

                        {/* ID and Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold">Tutorial ID (Unique Key)</label>
                            <input
                              type="text"
                              value={editingTutorial.id || ""}
                              onChange={(e) => updateEditingField("id", e.target.value)}
                              disabled={!isCreatingNew}
                              placeholder="e.g. ps5-umtx-exploit"
                              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none disabled:opacity-50"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold">Method Name / Title</label>
                            <input
                              type="text"
                              value={editingTutorial.name || ""}
                              onChange={(e) => updateEditingField("name", e.target.value)}
                              placeholder="e.g. Webkit & UMTX Kernel Hack"
                              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        {/* Firmware boundaries & console model selection */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold">Min Firmware Supported</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingTutorial.minFirmware || ""}
                              onChange={(e) => updateEditingField("minFirmware", parseFloat(e.target.value))}
                              placeholder="e.g. 1.00"
                              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-3 py-2 text-xs text-white focus:outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold">Max Firmware Supported</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingTutorial.maxFirmware || ""}
                              onChange={(e) => updateEditingField("maxFirmware", parseFloat(e.target.value))}
                              placeholder="e.g. 4.51"
                              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-3 py-2 text-xs text-white focus:outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold">Target PS5 Console Model</label>
                            <select
                              value={editingTutorial.ps5Model || "both"}
                              onChange={(e) => updateEditingField("ps5Model", e.target.value as PS5ModelType)}
                              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-2.5 py-2 text-xs text-white focus:outline-none"
                            >
                              <option value="both">All Consoles (Digital & Disk)</option>
                              <option value="digital">Digital Version Only</option>
                              <option value="disk">Disc Version Only</option>
                            </select>
                          </div>
                        </div>

                        {/* Status, Difficulty, Youtube ID */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold">Status Badge (e.g. Stable)</label>
                            <input
                              type="text"
                              value={editingTutorial.status || ""}
                              onChange={(e) => updateEditingField("status", e.target.value)}
                              placeholder="e.g. Stable, WIP, Beta"
                              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-3 py-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold">Difficulty Rating</label>
                            <select
                              value={editingTutorial.difficulty || "Medium"}
                              onChange={(e) => updateEditingField("difficulty", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-2.5 py-2 text-xs text-white focus:outline-none"
                            >
                              <option value="None">None (N/A)</option>
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold flex items-center gap-1">
                              <Video className="h-3 w-3 text-red-500" />
                              YouTube Video URL / ID
                            </label>
                            <input
                              type="text"
                              value={editingTutorial.youtubeId || ""}
                              onChange={(e) => updateEditingField("youtubeId", e.target.value)}
                              placeholder="e.g. b-hWeq-G99s or full URL"
                              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-3 py-2 text-xs text-white focus:outline-none font-mono"
                            />
                          </div>
                        </div>

                        {/* Youtube Preview Widget */}
                        {editingTutorial.youtubeId && (
                          <div className="p-3 bg-slate-900 rounded-lg border border-slate-850 flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <div className="h-8 w-8 rounded bg-red-500/10 flex items-center justify-center">
                                <Video className="h-4.5 w-4.5 text-red-500" />
                              </div>
                              <div>
                                <span className="text-[10px] block font-mono text-slate-400 uppercase">Live Embed Preview Key</span>
                                <span className="text-xs font-mono font-medium text-white">{extractYoutubeId(editingTutorial.youtubeId)}</span>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                              Embedded Successfully
                            </span>
                          </div>
                        )}

                        {/* Description */}
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold">Guide Overview / Description</label>
                          <textarea
                            value={editingTutorial.description || ""}
                            onChange={(e) => updateEditingField("description", e.target.value)}
                            rows={3}
                            placeholder="Provide a comprehensive summary of how this exploit behaves and what it triggers..."
                            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                          />
                        </div>

                        {/* Requirements */}
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold flex items-center justify-between">
                            <span>Pre-requisites / Requirements (one per line)</span>
                            <span className="text-[9px] text-slate-500 font-mono">Press Enter to add lines</span>
                          </label>
                          <textarea
                            value={editingTutorial.requirements?.join("\n") || ""}
                            onChange={(e) => updateEditingField("requirements", e.target.value.split("\n"))}
                            rows={3}
                            placeholder="PS5 running firmware 4.51 or lower&#10;PC connected to the same Wi-Fi&#10;exFAT USB drive"
                            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none"
                          />
                        </div>

                        {/* Steps */}
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold flex items-center justify-between">
                            <span>Step-by-Step Instructions (one per line)</span>
                            <span className="text-[9px] text-slate-500 font-mono">Each line constitutes one numbered step</span>
                          </label>
                          <textarea
                            value={editingTutorial.steps?.join("\n") || ""}
                            onChange={(e) => updateEditingField("steps", e.target.value.split("\n"))}
                            rows={4}
                            placeholder="Step 1: Go to network settings...&#10;Step 2: Enter Primary DNS...&#10;Step 3: Open User's Guide..."
                            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none"
                          />
                        </div>

                      </div>

                      {/* Form Actions */}
                      <div className="flex space-x-3 pt-4 border-t border-slate-850 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Cancel edits? Any unsaved changes will be lost.")) {
                              setIsCreatingNew(false);
                              if (tutorials.length > 0) {
                                setEditingTutorial({ ...tutorials[0] });
                              }
                            }
                          }}
                          className="flex-1 py-2 rounded-lg text-xs font-mono font-medium border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
                        >
                          Reset / Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/15 transition-all"
                        >
                          <Save className="h-4 w-4" />
                          <span>Save to Server Database</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex-1 border border-dashed border-slate-850 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-500">
                      <HelpCircle className="h-8 w-8 mb-2 text-slate-600" />
                      <p className="text-xs">Select or add a tutorial to populate editor fields.</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <button
                onClick={() => {
                  setIsAdminMode(false);
                  setIsAdminAuthenticated(false);
                }}
                className="text-xs text-slate-400 hover:text-indigo-400 transition-all"
              >
                ← Return to Jailbreak Wizard Guide
              </button>
            </div>
          </div>
        ) : (
          /* -------------------- USER WIZARD VIEW -------------------- */
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center">
            
            {/* Elegant Header Hero */}
            <div className="text-center mb-8">
              <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block mb-3">
                Firmware Companion Pro
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-white">
                Find Your PS5 Jailbreak Method
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto mt-2 leading-relaxed">
                Choose your hardware model, input your system firmware version, and retrieve a customized, interactive step-by-step hack guide instantly.
              </p>
            </div>

            {/* Steps Visual Indicator */}
            <div className="flex items-center justify-center space-x-3 mb-10 max-w-md mx-auto">
              <div 
                onClick={() => model && setCurrentStep(1)}
                className={`flex items-center space-x-1.5 cursor-pointer text-xs font-mono transition-all ${
                  currentStep >= 1 ? "text-indigo-400 font-bold" : "text-slate-600"
                }`}
              >
                <span className={`h-6 w-6 rounded-full flex items-center justify-center border text-[11px] ${
                  currentStep >= 1 ? "bg-indigo-950/80 border-indigo-500 text-indigo-300" : "bg-slate-900 border-slate-800 text-slate-500"
                }`}>1</span>
                <span>Console Model</span>
              </div>
              <div className="h-px bg-slate-850 w-8"></div>
              <div 
                onClick={() => model && setCurrentStep(2)}
                className={`flex items-center space-x-1.5 cursor-pointer text-xs font-mono transition-all ${
                  currentStep >= 2 ? "text-indigo-400 font-bold" : "text-slate-600"
                }`}
              >
                <span className={`h-6 w-6 rounded-full flex items-center justify-center border text-[11px] ${
                  currentStep >= 2 ? "bg-indigo-950/80 border-indigo-500 text-indigo-300" : "bg-slate-900 border-slate-800 text-slate-500"
                }`}>2</span>
                <span>Firmware Check</span>
              </div>
              <div className="h-px bg-slate-850 w-8"></div>
              <div className={`flex items-center space-x-1.5 text-xs font-mono transition-all ${
                currentStep === 3 ? "text-indigo-400 font-bold" : "text-slate-600"
              }`}>
                <span className={`h-6 w-6 rounded-full flex items-center justify-center border text-[11px] ${
                  currentStep === 3 ? "bg-indigo-950/80 border-indigo-500 text-indigo-300" : "bg-slate-900 border-slate-800 text-slate-500"
                }`}>3</span>
                <span>Jailbreak Guide</span>
              </div>
            </div>

            {/* WIZARD CONTENT CARDS */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl min-h-[380px] flex flex-col justify-between relative">
              
              {/* STEP 1: CONSOLE MODEL */}
              {currentStep === 1 && (
                <div className="space-y-6 flex-1 flex flex-col justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-display font-bold text-white mb-1">
                      Which PlayStation 5 model do you own?
                    </h3>
                    <p className="text-xs text-slate-400">
                      Disk/Disc consoles support specific Blu-ray disc Java exploit payloads, whereas Digital editions utilize purely web-based hosts.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-xl mx-auto w-full pt-2">
                    {/* DIGITAL OPTION */}
                    <button
                      onClick={() => {
                        setModel('digital');
                        setCurrentStep(2);
                      }}
                      className={`group relative p-6 rounded-xl border text-left transition-all ${
                        model === 'digital'
                          ? 'bg-indigo-950/30 border-indigo-500 shadow-lg shadow-indigo-500/5 text-white'
                          : 'bg-slate-950/40 border-slate-850 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Cpu className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-mono font-medium text-slate-500 uppercase tracking-widest">Symmetrical Design</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-4 group-hover:text-indigo-300 transition-colors">Digital Version</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        Sleek edition without optical drive tray. Relies entirely on the Webkit browser sandbox for payload delivery and homebrew setup.
                      </p>
                      <div className="mt-4 pt-4 border-t border-slate-900 flex items-center justify-between text-xs text-indigo-400 font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Select Version</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </button>

                    {/* DISK OPTION */}
                    <button
                      onClick={() => {
                        setModel('disk');
                        setCurrentStep(2);
                      }}
                      className={`group relative p-6 rounded-xl border text-left transition-all ${
                        model === 'disk'
                          ? 'bg-indigo-950/30 border-indigo-500 shadow-lg shadow-indigo-500/5 text-white'
                          : 'bg-slate-950/40 border-slate-850 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Disc className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-mono font-medium text-slate-500 uppercase tracking-widest">Blu-Ray Built-In</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-4 group-hover:text-indigo-300 transition-colors">Disk / Disc Version</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        Consoles equipped with the physical Blu-ray drive. Supports BD-JB Java disc exploits which are highly stable and reliable.
                      </p>
                      <div className="mt-4 pt-4 border-t border-slate-900 flex items-center justify-between text-xs text-indigo-400 font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Select Version</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: FIRMWARE INPUT */}
              {currentStep === 2 && (
                <div className="space-y-6 flex-1 flex flex-col justify-center">
                  <div className="text-center">
                    <button 
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center space-x-1 mb-2 font-mono"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>Back to Model Selection ({model === 'digital' ? 'Digital' : 'Disk'})</span>
                    </button>
                    <h3 className="text-lg font-display font-bold text-white">
                      Enter Your System Firmware Version
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Check your firmware version on your PS5 in: <span className="text-indigo-300 font-mono font-semibold">Settings &gt; System &gt; System Software &gt; Console Information</span>.
                    </p>
                  </div>

                  <div className="max-w-xl mx-auto w-full space-y-5">
                    {/* Dynamic typed Firmware input slider / text box combo */}
                    <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Decimal Firmware Version</label>
                        <input
                          type="text"
                          value={firmwareInput}
                          onChange={(e) => {
                            // sanitize to only allow decimals
                            const clean = e.target.value.replace(/[^0-9.]/g, '');
                            setFirmwareInput(clean);
                          }}
                          className="w-full bg-transparent text-xl font-mono font-bold text-white placeholder-slate-700 border-none outline-none focus:ring-0"
                          placeholder="e.g. 4.03"
                        />
                      </div>
                      <div className="h-10 w-px bg-slate-850"></div>
                      <div className="text-right">
                        <span className="text-[10px] block font-mono text-slate-400 uppercase">Input Status</span>
                        {isNaN(parseFloat(firmwareInput)) ? (
                          <span className="text-xs font-mono font-bold text-rose-400">Invalid Number</span>
                        ) : parseFloat(firmwareInput) <= 4.51 ? (
                          <span className="text-xs font-mono font-bold text-emerald-400">✓ Hackable</span>
                        ) : parseFloat(firmwareInput) <= 7.61 ? (
                          <span className="text-xs font-mono font-bold text-amber-400">⚡ Alt Available</span>
                        ) : (
                          <span className="text-xs font-mono font-bold text-slate-400">No Jailbreak Yet</span>
                        )}
                      </div>
                    </div>

                    {/* Quick Preset Badges */}
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2.5">
                        Popular Firmwares & Presets
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {firmwarePresets.map((preset) => (
                          <button
                            key={preset.value}
                            onClick={() => setFirmwareInput(preset.value)}
                            className={`p-2 rounded-lg text-xs font-mono border text-center transition-all ${
                              firmwareInput === preset.value
                                ? "bg-indigo-600 border-indigo-500 text-white font-bold"
                                : "bg-slate-950/60 border-slate-850/80 text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            {preset.value}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Proceed Action Button */}
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => {
                          if (firmwareInput && !isNaN(parseFloat(firmwareInput))) {
                            setCurrentStep(3);
                          } else {
                            alert("Please enter a valid numeric firmware version (e.g. 4.03)");
                          }
                        }}
                        disabled={!firmwareInput || isNaN(parseFloat(firmwareInput))}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white font-semibold text-xs py-2.5 rounded-lg transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center space-x-1.5 disabled:opacity-40"
                      >
                        <span>Match Hack Tutorial</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* STEP 3: RESULT JAILBREAK GUIDE */}
              {currentStep === 3 && (
                <div className="space-y-6 flex-1">
                  
                  {/* Result Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-850">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center space-x-1 font-mono self-start"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>Back to Firmware Input</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400">Selection:</span>
                      <span className="text-xs font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-indigo-300">
                        {model === 'digital' ? 'Digital' : 'Disk'} Edition
                      </span>
                      <span className="text-xs font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-indigo-300">
                        Firmware {firmwareInput}
                      </span>
                    </div>
                  </div>

                  {matchedTutorial ? (
                    <div className="space-y-6 text-left">
                      
                      {/* Name and Basic badges */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-indigo-950/15 border border-indigo-900/10 p-4 rounded-xl">
                        <div>
                          <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block mb-1">Matched Hack Method</span>
                          <h4 className="text-base md:text-lg font-bold text-white">{matchedTutorial.name}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          {renderDifficultyBadge(matchedTutorial.difficulty)}
                          <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-full bg-slate-900 border border-slate-800 text-indigo-300">
                            Status: {matchedTutorial.status}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                          <Info className="h-3.5 w-3.5 text-indigo-400" />
                          Method Overview
                        </h5>
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/30 p-3 rounded-lg border border-slate-850/60">
                          {matchedTutorial.description}
                        </p>
                      </div>

                      {/* Video Guide Embed Area */}
                      {matchedTutorial.youtubeId ? (
                        <div className="space-y-2">
                          <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                            <Video className="h-3.5 w-3.5 text-red-500" />
                            YouTube Companion Tutorial (Recommended Video)
                          </h5>
                          <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                            <iframe
                              src={`https://www.youtube.com/embed/${extractYoutubeId(matchedTutorial.youtubeId)}`}
                              title={`${matchedTutorial.name} Tutorial Guide`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full border-0"
                            ></iframe>
                          </div>
                          <p className="text-[10px] text-slate-500 text-center italic">
                            Watch this companion guide to verify the physical steps and payload loading logs.
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center space-x-3 text-slate-400">
                          <Video className="h-5 w-5 text-slate-600 shrink-0" />
                          <p className="text-xs italic">No video tutorial was embedded for this firmware method yet.</p>
                        </div>
                      )}

                      {/* Pre-requisites checklist */}
                      <div className="space-y-2.5">
                        <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <ListChecks className="h-3.5 w-3.5 text-indigo-400" />
                          Before You Start (Checklist)
                        </h5>
                        <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-3.5 space-y-2">
                          {matchedTutorial.requirements && matchedTutorial.requirements.map((req, i) => (
                            <label
                              key={i}
                              className={`flex items-start space-x-2.5 p-1.5 rounded text-xs cursor-pointer transition-colors ${
                                checkedRequirements[`req-${i}`] 
                                  ? 'text-slate-500 line-through' 
                                  : 'text-slate-300 hover:text-white'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={!!checkedRequirements[`req-${i}`]}
                                onChange={(e) => setCheckedRequirements(prev => ({
                                  ...prev,
                                  [`req-${i}`]: e.target.checked
                                }))}
                                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-700 text-indigo-600 focus:ring-0 bg-slate-900"
                              />
                              <span>{req}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Steps Checklist */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-indigo-400" />
                          Step-By-Step Hacking Procedure
                        </h5>
                        <div className="space-y-2.5">
                          {matchedTutorial.steps && matchedTutorial.steps.map((step, idx) => (
                            <div
                              key={idx}
                              onClick={() => setCheckedSteps(prev => ({
                                ...prev,
                                [idx]: !prev[idx]
                              }))}
                              className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start space-x-3 ${
                                checkedSteps[idx]
                                  ? "bg-slate-950/20 border-slate-850 text-slate-500 line-through"
                                  : "bg-slate-900/60 border-slate-800/80 text-slate-200 hover:border-slate-700 hover:bg-slate-900/80"
                              }`}
                            >
                              <span className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] ${
                                checkedSteps[idx]
                                  ? "bg-slate-950 border-slate-850 text-slate-600"
                                  : "bg-indigo-950/60 border-indigo-900 text-indigo-400"
                              }`}>
                                {idx + 1}
                              </span>
                              <p className="flex-1 leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 space-y-4">
                      <div className="h-12 w-12 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center mx-auto text-amber-400">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">No Configured Tutorial Found</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          There is no specific tutorial matching firmware <span className="font-mono text-indigo-400">{firmwareInput}</span> for your <span className="font-mono text-indigo-400">{model}</span> console in the database.
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={handleReset}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-lg text-xs font-mono transition-all border border-slate-800"
                        >
                          Restart Wizard
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reset Bottom Controls */}
                  <div className="pt-6 border-t border-slate-850 flex items-center justify-between">
                    <p className="text-[10px] text-slate-500 font-mono">
                      Stay updated! Never download Sony software updates.
                    </p>
                    <button
                      onClick={handleReset}
                      className="px-4 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-medium border border-indigo-500/20 transition-all"
                    >
                      Check Another PS5
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* Footer information */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 z-10 text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-2 sm:space-y-0">
          <p>© 2026 PS5 Hacking Companion. Created for educational and homebrew development research only.</p>
          <p className="font-mono text-[10px]">
            FW Database: <span className="text-indigo-400">Live JSON Node Store</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
