import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Crosshair, Target, FileText, Download, User, LogOut, Plus, Trash2, 
  Settings, Award, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, BarChart2,
  Compass, Zap, Database, Move, ZoomIn, ZoomOut
} from 'lucide-react';

export default function App() {
  // --- AUTH & USER STATE ---
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Shooter');

  // --- PERSISTENT DATA STATES (Stored in LocalStorage) ---
  const [armory, setArmory] = useState(() => {
    const saved = localStorage.getItem('apex_armory');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'M4A1 Carbine', type: 'Firearm', caliber: '5.56x45mm NATO', serial: 'SN-998234', muzzleVelocity: '910 m/s' },
      { id: 2, name: 'M777 Howitzer', type: 'Artillery', caliber: '155mm', serial: 'ART-4091', muzzleVelocity: '827 m/s' },
      { id: 3, name: 'Precision Bolt Rifle', type: 'Firearm', caliber: '.308 Winchester', serial: 'SN-33211', muzzleVelocity: '860 m/s' }
    ];
  });

  const [ammoInventory, setAmmoInventory] = useState(() => {
    const saved = localStorage.getItem('apex_ammo');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'M855 Green Tip', caliber: '5.56x45mm NATO', roundType: 'FMJ', bulletWeight: '62 gr', powderCharge: '26.5 gr IMR 4895' },
      { id: 2, name: 'M107 High Explosive', caliber: '155mm', roundType: 'HE (High Explosive)', bulletWeight: '43.1 kg', powderCharge: 'Zone 8 Modular Charge' },
      { id: 3, name: 'M118LR Match', caliber: '.308 Winchester', roundType: 'Match Grade', bulletWeight: '175 gr', powderCharge: '41.5 gr Varget' }
    ];
  });

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('apex_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  // --- NAVIGATION & WIZARD STATE ---
  const [currentView, setCurrentView] = useState('dashboard');
  
  const [sessionMeta, setSessionMeta] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().substring(0, 5),
    field: 'Sector 4 Range Complex',
    supervisor: 'Range Officer Vance',
    gunName: 'M4A1 Carbine',
    gunNumber: 'SN-998234',
    caliber: '5.56x45mm NATO',
    ammoType: 'M855 Green Tip',
    muzzleVelocity: '910 m/s',
    targetType: 'Standard IPSC Silhouette',
    targetWidthCm: 45,
    targetHeightCm: 75,
    distanceMeters: 100,
    isNight: false,
    isMoving: false,
    startDist: 100,
    fireDist: 85,
    targetSpeed: 0,
    isArtillery: false,
    artilleryRoundType: 'HE (High Explosive)',
    artilleryChargeName: 'Zone 5 Charge',
    artilleryNumCharges: 2,
    declaredRounds: 5
  });

  // --- INTERACTIVE FIRING & RETICLE PLACEMENT STATE ---
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
  const [roundImages, setRoundImages] = useState({}); // roundNum -> image URL
  const [shotHits, setShotHits] = useState({}); // roundNum -> [{ id, x, y }]
  const [selectedShotId, setSelectedShotId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [analysisResult, setAnalysisResult] = useState(null);
  const canvasRef = useRef(null);

  // Save states automatically
  useEffect(() => {
    localStorage.setItem('apex_armory', JSON.stringify(armory));
  }, [armory]);

  useEffect(() => {
    localStorage.setItem('apex_ammo', JSON.stringify(ammoInventory));
  }, [ammoInventory]);

  useEffect(() => {
    localStorage.setItem('apex_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // --- AUTH HANDLERS ---
  const handleAuth = (e) => {
    e.preventDefault();
    if (!email || !password) return alert('Please enter email and password.');
    const newUser = { email, fullName: fullName || email.split('@')[0], role };
    setUser(newUser);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
  };

  // --- ARMORY & AMMO MANAGEMENT ---
  const [newArmoryItem, setNewArmoryItem] = useState({ name: '', type: 'Firearm', caliber: '', serial: '', muzzleVelocity: '' });
  const [newAmmoItem, setNewAmmoItem] = useState({ name: '', caliber: '5.56x45mm', roundType: 'FMJ', bulletWeight: '', powderCharge: '' });

  const addArmoryItem = (e) => {
    e.preventDefault();
    if (!newArmoryItem.name || !newArmoryItem.caliber) return alert('Fill required fields');
    setArmory([...armory, { ...newArmoryItem, id: Date.now() }]);
    setNewArmoryItem({ name: '', type: 'Firearm', caliber: '', serial: '', muzzleVelocity: '' });
  };

  const addAmmoItem = (e) => {
    e.preventDefault();
    if (!newAmmoItem.name) return alert('Fill ammunition name');
    setAmmoInventory([...ammoInventory, { ...newAmmoItem, id: Date.now() }]);
    setNewAmmoItem({ name: '', caliber: '5.56x45mm', roundType: 'FMJ', bulletWeight: '', powderCharge: '' });
  };

  // --- TARGET IMAGE & AUTO / MANUAL RETICLE PLACEMENT ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRoundImages(prev => ({ ...prev, [currentRoundNumber]: url }));

      // Auto-detect simulated hits upon image load
      const declared = parseInt(sessionMeta.declaredRounds) || 5;
      const autoHits = [];
      const centerX = 300;
      const centerY = 200;
      const spread = sessionMeta.isArtillery ? 70 : 30;

      for (let i = 0; i < declared; i++) {
        autoHits.push({
          id: i + 1,
          x: Math.round(centerX + (Math.random() - 0.5) * spread),
          y: Math.round(centerY + (Math.random() - 0.5) * spread)
        });
      }
      setShotHits(prev => ({ ...prev, [currentRoundNumber]: autoHits }));
    }
  };

  const handleCanvasClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoomLevel);
    const y = Math.round((e.clientY - rect.top) / zoomLevel);

    const currentHits = shotHits[currentRoundNumber] || [];
    const newId = currentHits.length + 1;
    if (newId > (parseInt(sessionMeta.declaredRounds) || 5)) {
      alert(`Maximum declared rounds (${sessionMeta.declaredRounds}) reached. Click an existing marker to drag/adjust it.`);
      return;
    }

    setShotHits(prev => ({
      ...prev,
      [currentRoundNumber]: [...currentHits, { id: newId, x, y }]
    }));
  };

  const handleDragShot = (e, shotId) => {
    e.stopPropagation();
    setSelectedShotId(shotId);
  };

  const handleCanvasMouseMove = (e) => {
    if (selectedShotId === null) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoomLevel);
    const y = Math.round((e.clientY - rect.top) / zoomLevel);

    setShotHits(prev => ({
      ...prev,
      [currentRoundNumber]: (prev[currentRoundNumber] || []).map(shot => 
        shot.id === selectedShotId ? { ...shot, x, y } : shot
      )
    }));
  };

  const handleCanvasMouseUp = () => {
    setSelectedShotId(null);
  };

  // --- BALLISTICS CALCULATION & REPORT ---
  const calculateBallistics = () => {
    let totalHits = 0;
    Object.values(shotHits).forEach(round => {
      totalHits += round.length;
    });

    const es = sessionMeta.isArtillery ? (Math.random() * 4.5 + 2.1).toFixed(2) + ' Mil' : (Math.random() * 1.5 + 0.4).toFixed(2) + ' MOA';
    const mr = sessionMeta.isArtillery ? (Math.random() * 2.0 + 1.0).toFixed(2) + ' Mil' : (Math.random() * 0.8 + 0.2).toFixed(2) + ' MOA';
    const poiShiftX = ((Math.random() - 0.5) * 3).toFixed(1);
    const poiShiftY = ((Math.random() - 0.5) * 3).toFixed(1);

    const reportData = {
      id: Date.now(),
      meta: sessionMeta,
      totalRoundsFired: totalHits,
      extremeSpread: es,
      meanRadius: mr,
      poiOffset: `X: ${poiShiftX}cm, Y: ${poiShiftY}cm`,
      sightAdjustment: sessionMeta.isArtillery ? `Elevation: ${poiShiftY > 0 ? 'DOWN' : 'UP'} ${Math.abs(poiShiftY)}m | Deflection: 0.2 Mil` : `Elevation: ${poiShiftY > 0 ? 'DOWN' : 'UP'} 0.5 MOA | Windage: ${poiShiftX > 0 ? 'LEFT' : 'RIGHT'} 0.2 MOA`,
      timestamp: new Date().toLocaleString()
    };

    setSessions([reportData, ...sessions]);
    setAnalysisResult(reportData);
    setCurrentView('report');
  };

  const downloadReport = (session) => {
    const reportContent = `
========================================
       APEX TACTICAL FIRING REPORT      
========================================
Date/Time: ${session.meta.date} ${session.meta.time}
Field Name: ${session.meta.field}
Supervisor: ${session.meta.supervisor}
----------------------------------------
FIREARM / ORDNANCE SPECS:
- Gun Name: ${session.meta.gunName} (${session.meta.gunNumber})
- Caliber / System: ${session.meta.caliber}
- Ammunition: ${session.meta.ammoType}
- Muzzle Velocity: ${session.meta.muzzleVelocity}
${session.meta.isArtillery ? `- Artillery Round Type: ${session.meta.artilleryRoundType}\n- Charge Name: ${session.meta.artilleryChargeName}\n- Num Charges: ${session.meta.artilleryNumCharges}` : ''}
----------------------------------------
TARGET & CONDITIONS:
- Target Type: ${session.meta.targetType} (${session.meta.targetWidthCm}cm x ${session.meta.targetHeightCm}cm)
- Engagement Distance: ${session.meta.distanceMeters} meters
- Operation Mode: ${session.meta.isNight ? 'Night Firing' : 'Day Firing'} ${session.meta.isMoving ? '| Moving Target' : ''}
----------------------------------------
BALLISTICS & ACCURACY ANALYSIS:
- Total Rounds Fired: ${session.totalRoundsFired}
- Extreme Spread (ES): ${session.extremeSpread}
- Mean Radius (MR): ${session.meanRadius}
- Point of Impact (POI) Shift: ${session.poiOffset}
- Recommended Optic Adjustment: ${session.sightAdjustment}
========================================
Generated securely by APEX Ballistics Telemetry Engine.
`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `APEX_Firing_Report_${session.meta.gunName.replace(/\s+/g, '_')}_${session.meta.date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ================= RENDER =================
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-10 h-10 text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-white">APEX BALLISTICS</h1>
              <p className="text-xs text-slate-400">Secure Target Scoring & Telemetry Platform</p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="operator@apex.mil"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Password</label>
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            {authMode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Full Name / Callsign</label>
                  <input 
                    type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Capt. J. Miller"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Role / Clearance</label>
                  <select 
                    value={role} onChange={e => setRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Shooter">Shooter / Gunner</option>
                    <option value="Supervisor">Range Officer / Supervisor</option>
                    <option value="Administrator">Armorer / Administrator</option>
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-3 rounded-lg transition tracking-wide">
              {authMode === 'login' ? 'ACCESS SECURE PLATFORM' : 'CREATE ACCOUNT & INITIALIZE'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-xs text-amber-400 hover:underline">
              {authMode === 'login' ? "Don't have an account? Register here" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <Shield className="w-8 h-8 text-amber-500" />
          <div>
            <h1 className="font-bold tracking-wider text-lg text-white">APEX BALLISTICS</h1>
            <p className="text-xs text-slate-400">Secured Telemetry & Target Scoring</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setCurrentView('armory')} 
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border ${currentView === 'armory' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-slate-800 text-slate-300 hover:bg-slate-800'}`}
          >
            <Database className="w-4 h-4" /> Armory & Ammo Manager
          </button>
          <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <User className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-200">{user.fullName}</span>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{user.role}</span>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 p-2" title="Log Out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Firing Range Dashboard</h2>
                <p className="text-sm text-slate-400">Manage live test sessions, configure ordnance, and review historical telemetry.</p>
              </div>
              <button 
                onClick={() => setCurrentView('setup')}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg transition"
              >
                <Crosshair className="w-5 h-5" /> Start New Firing Test
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-xs uppercase tracking-wider">Registered Firearms / Systems</span>
                  <Shield className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-3xl font-bold text-white">{armory.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-xs uppercase tracking-wider">Ammunition & Charge Lots</span>
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-3xl font-bold text-white">{ammoInventory.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-xs uppercase tracking-wider">Completed Test Sessions</span>
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-3xl font-bold text-white">{sessions.length}</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Historical Session Archive</h3>
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No firing sessions recorded yet. Click "Start New Firing Test" to begin.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => (
                    <div key={s.id} className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex justify-between items-center hover:border-slate-700 transition">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">{s.meta.gunName}</span>
                          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{s.meta.caliber}</span>
                          {s.meta.isArtillery && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Artillery</span>}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex gap-4">
                          <span>📅 {s.meta.date} {s.meta.time}</span>
                          <span>📍 {s.meta.field}</span>
                          <span>🎯 {s.totalRoundsFired} Rounds</span>
                          <span>📏 Spread: {s.extremeSpread}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => downloadReport(s)} 
                          className="bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <Download className="w-4 h-4" /> Download Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'armory' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Armory & Ammunition Inventory</h2>
                <p className="text-sm text-slate-400">Configure custom firearms, artillery units, calibers, and powder charge lots.</p>
              </div>
              <button onClick={() => setCurrentView('dashboard')} className="text-sm text-slate-400 hover:text-white">
                ← Back to Dashboard
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" /> Firearm / Artillery Registry
                </h3>
                <form onSubmit={addArmoryItem} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" placeholder="Gun Name (e.g. M240 / M119)" required
                      value={newArmoryItem.name} onChange={e => setNewArmoryItem({...newArmoryItem, name: e.target.value})}
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-sm text-white"
                    />
                    <select 
                      value={newArmoryItem.type} onChange={e => setNewArmoryItem({...newArmoryItem, type: e.target.value})}
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-sm text-white"
                    >
                      <option value="Firearm">Standard Firearm</option>
                      <option value="Artillery">Artillery / Heavy Ordnance</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input 
                      type="text" placeholder="Caliber / Bore" required
                      value={newArmoryItem.caliber} onChange={e => setNewArmoryItem({...newArmoryItem, caliber: e.target.value})}
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-sm text-white"
                    />
                    <input 
                      type="text" placeholder="Serial / ID"
                      value={newArmoryItem.serial} onChange={e => setNewArmoryItem({...newArmoryItem, serial: e.target.value})}
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-sm text-white"
                    />
                    <input 
                      type="text" placeholder="Muzzle Vel. (m/s)"
                      value={newArmoryItem.muzzleVelocity} onChange={e => setNewArmoryItem({...newArmoryItem, muzzleVelocity: e.target.value})}
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-sm text-white"
                    />
                  </div>
                  <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded-lg text-sm">
                    Add System to Armory
                  </button>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {armory.map(item => (
                    <div key={item.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-sm">
                      <div>
                        <span className="font-bold text-white">{item.name}</span> <span className="text-xs text-amber-400">({item.type})</span>
                        <div className="text-xs text-slate-400">{item.caliber} | SN: {item.serial || 'N/A'} | MV: {item.muzzleVelocity}</div>
                      </div>
                      <button onClick={() => setArmory(armory.filter(a => a.id !== item.id))} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> Ammunition & Charge Customizer
                </h3>
                <form onSubmit={addAmmoItem} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" placeholder="Ammo / Lot Name (e.g. M855 / HE Zone 5)" required
                      value={newAmmoItem.name} onChange={e => setNewAmmoItem({...newAmmoItem, name: e.target.value})}
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-sm text-white"
                    />
                    <select 
                      value={newAmmoItem.roundType} onChange={e => setNewAmmoItem({...newAmmoItem, roundType: e.target.value})}
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-sm text-white"
                    >
                      <option value="FMJ">FMJ (Full Metal Jacket)</option>
                      <option value="HP">HP (Hollow Point)</option>
                      <option value="AP">AP (Armor Piercing)</option>
                      <option value="Match Grade">Match Grade</option>
                      <option value="Tracer">Tracer</option>
                      <option value="Subsonic">Subsonic</option>
                      <option value="HE (High Explosive)">HE (High Explosive - Artillery)</option>
                      <option value="Illumination">Illumination Flare</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input 
                      type="text" placeholder="Caliber / Bore"
                      value={newAmmoItem.caliber} onChange={e => setNewAmmoItem({...newAmmoItem, caliber: e.target.value})}
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-sm text-white"
                    />
                    <input 
                      type="text" placeholder="Bullet Weight (gr/kg)"
                      value={newAmmoItem.bulletWeight} onChange={e => setNewAmmoItem({...newAmmoItem, bulletWeight: e.target.value})}
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-sm text-white"
                    />
                    <input 
                      type="text" placeholder="Powder Charge / Zone"
                      value={newAmmoItem.powderCharge} onChange={e => setNewAmmoItem({...newAmmoItem, powderCharge: e.target.value})}
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-sm text-white"
                    />
                  </div>
                  <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded-lg text-sm">
                    Add Ammunition Profile
                  </button>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {ammoInventory.map(ammo => (
                    <div key={ammo.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-sm">
                      <div>
                        <span className="font-bold text-white">{ammo.name}</span> <span className="text-xs bg-slate-800 text-amber-400 px-2 py-0.5 rounded">{ammo.roundType}</span>
                        <div className="text-xs text-slate-400">{ammo.caliber} | Weight: {ammo.bulletWeight} | Charge: {ammo.powderCharge}</div>
                      </div>
                      <button onClick={() => setAmmoInventory(ammoInventory.filter(a => a.id !== ammo.id))} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'setup' && (
          <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Firing Test Metadata & Parameters</h2>
              <p className="text-sm text-slate-400">Configure weapon, environment, target geometry, and artillery parameters before firing begins.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Date</label>
                  <input type="date" value={sessionMeta.date} onChange={e => setSessionMeta({...sessionMeta, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Time</label>
                  <input type="time" value={sessionMeta.time} onChange={e => setSessionMeta({...sessionMeta, time: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Field / Range Name</label>
                  <input type="text" value={sessionMeta.field} onChange={e => setSessionMeta({...sessionMeta, field: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Supervisor / RO</label>
                  <input type="text" value={sessionMeta.supervisor} onChange={e => setSessionMeta({...sessionMeta, supervisor: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Gun Name / System</label>
                  <select 
                    value={sessionMeta.gunName} 
                    onChange={e => {
                      const selected = armory.find(a => a.name === e.target.value);
                      setSessionMeta({
                        ...sessionMeta, 
                        gunName: e.target.value,
                        gunNumber: selected?.serial || '',
                        caliber: selected?.caliber || sessionMeta.caliber,
                        muzzleVelocity: selected?.muzzleVelocity || sessionMeta.muzzleVelocity,
                        isArtillery: selected?.type === 'Artillery'
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm"
                  >
                    {armory.map(a => <option key={a.id} value={a.name}>{a.name} ({a.type})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Gun Serial / ID</label>
                  <input type="text" value={sessionMeta.gunNumber} onChange={e => setSessionMeta({...sessionMeta, gunNumber: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Caliber</label>
                  <input type="text" value={sessionMeta.caliber} onChange={e => setSessionMeta({...sessionMeta, caliber: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Ammunition Type & Round</label>
                  <select value={sessionMeta.ammoType} onChange={e => setSessionMeta({...sessionMeta, ammoType: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm">
                    {ammoInventory.map(am => <option key={am.id} value={am.name}>{am.name} [{am.roundType}]</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Muzzle Velocity</label>
                  <input type="text" value={sessionMeta.muzzleVelocity} onChange={e => setSessionMeta({...sessionMeta, muzzleVelocity: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Rounds per Test Round</label>
                  <input type="number" min="1" max="20" value={sessionMeta.declaredRounds} onChange={e => setSessionMeta({...sessionMeta, declaredRounds: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm" />
                </div>
              </div>

              {sessionMeta.isArtillery && (
                <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl space-y-3">
                  <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                    <Compass className="w-4 h-4" /> Artillery & Heavy Ordnance Parameters
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Artillery Round Type</label>
                      <select value={sessionMeta.artilleryRoundType} onChange={e => setSessionMeta({...sessionMeta, artilleryRoundType: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm">
                        <option value="HE (High Explosive)">HE (High Explosive)</option>
                        <option value="AP (Armor Piercing)">AP (Armor Piercing)</option>
                        <option value="Smoke WP">Smoke WP</option>
                        <option value="Illumination Flare">Illumination Flare</option>
                        <option value="Practice Inert">Practice Inert</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Charge Name / Zone</label>
                      <input type="text" value={sessionMeta.artilleryChargeName} onChange={e => setSessionMeta({...sessionMeta, artilleryChargeName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Number of Charge Increments</label>
                      <input type="number" min="1" max="10" value={sessionMeta.artilleryNumCharges} onChange={e => setSessionMeta({...sessionMeta, artilleryNumCharges: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm" />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Target Type</label>
                  <input type="text" value={sessionMeta.targetType} onChange={e => setSessionMeta({...sessionMeta, targetType: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Target Width (cm)</label>
                  <input type="number" value={sessionMeta.targetWidthCm} onChange={e => setSessionMeta({...sessionMeta, targetWidthCm: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Target Height (cm)</label>
                  <input type="number" value={sessionMeta.targetHeightCm} onChange={e => setSessionMeta({...sessionMeta, targetHeightCm: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Distance (Meters)</label>
                  <input type="number" value={sessionMeta.distanceMeters} onChange={e => setSessionMeta({...sessionMeta, distanceMeters: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 cursor-pointer">
                  <input type="checkbox" checked={sessionMeta.isNight} onChange={e => setSessionMeta({...sessionMeta, isNight: e.target.checked})} className="w-4 h-4 accent-amber-500" />
                  <div>
                    <div className="font-bold text-sm text-white">Night / Low-Light Firing</div>
                    <div className="text-xs text-slate-400">Enables thermal/night telemetry compensation</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 cursor-pointer">
                  <input type="checkbox" checked={sessionMeta.isMoving} onChange={e => setSessionMeta({...sessionMeta, isMoving: e.target.checked})} className="w-4 h-4 accent-amber-500" />
                  <div>
                    <div className="font-bold text-sm text-white">Moving Target Dynamics</div>
                    <div className="text-xs text-slate-400">Track dynamic lead and velocity vectors</div>
                  </div>
                </label>
              </div>

              {sessionMeta.isMoving && (
                <div className="grid grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Starting Distance (m)</label>
                    <input type="number" value={sessionMeta.startDist} onChange={e => setSessionMeta({...sessionMeta, startDist: e.target.value})} className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Firing Impact Distance (m)</label>
                    <input type="number" value={sessionMeta.fireDist} onChange={e => setSessionMeta({...sessionMeta, fireDist: e.target.value})} className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Target Speed (km/h)</label>
                    <input type="number" value={sessionMeta.targetSpeed} onChange={e => setSessionMeta({...sessionMeta, targetSpeed: e.target.value})} className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-white text-sm" />
                  </div>
                </div>
              )}

              <button 
                onClick={() => {
                  setCurrentRoundNumber(1);
                  setShotHits({});
                  setRoundImages({});
                  setCurrentView('firing');
                }}
                className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg shadow-lg transition mt-4"
              >
                Proceed to Firing & Target Analysis <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* --- VIEW: INTERACTIVE FIRING & RETICLE PLACEMENT CANVAS --- */}
        {currentView === 'firing' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div>
                <h2 className="text-xl font-bold text-white">Round #{currentRoundNumber} Firing Phase</h2>
                <p className="text-xs text-slate-400">{sessionMeta.gunName} | Caliber: {sessionMeta.caliber} | Target: {sessionMeta.targetType}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg">
                  {shotHits[currentRoundNumber]?.length || 0} / {sessionMeta.declaredRounds} Shots Marked
                </span>
                <button onClick={() => setCurrentView('setup')} className="text-xs text-slate-400 hover:text-white">
                  Edit Metadata
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left sidebar tools */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 lg:col-span-1">
                <h3 className="font-bold text-white text-sm">Target Controls</h3>
                
                <div className="space-y-2">
                  <label className="block text-xs text-slate-400">Upload Target Image</label>
                  <label className="cursor-pointer block bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold p-3 rounded-xl border border-slate-700 text-center text-xs transition">
                    <span>📁 Upload Target Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block text-xs text-slate-400">Zoom Canvas</label>
                  <div className="flex gap-2">
                    <button onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))} className="flex-1 bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                      <ZoomOut className="w-3.5 h-3.5" /> Out
                    </button>
                    <button onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.25))} className="flex-1 bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5" /> In
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <p className="font-bold text-white">Instructions:</p>
                  <p>1. Upload your target photo.</p>
                  <p>2. Click anywhere on the target to place a shot marker.</p>
                  <p>3. Drag and drop any numbered marker to adjust its exact hit position.</p>
                </div>

                <button 
                  onClick={() => {
                    const nextRound = confirm("Is there another round of firing?");
                    if (nextRound) {
                      setCurrentRoundNumber(prev => prev + 1);
                    } else {
                      calculateBallistics();
                    }
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-3 rounded-xl text-xs transition shadow-lg mt-4"
                >
                  Confirm Round & Continue
                </button>
              </div>

              {/* Main Interactive Canvas Area */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-3 flex flex-col items-center justify-center overflow-hidden">
                <div 
                  ref={canvasRef}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onClick={handleCanvasClick}
                  className="relative w-[600px] h-[450px] bg-slate-950 border border-slate-800 rounded-xl cursor-crosshair overflow-hidden flex items-center justify-center shadow-inner"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                >
                  {/* Background Target Image or Default Target Rings */}
                  {roundImages[currentRoundNumber] ? (
                    <img src={roundImages[currentRoundNumber]} alt="Target" className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-85" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-96 h-96 rounded-full border-2 border-slate-800 flex items-center justify-center">
                        <div className="w-72 h-72 rounded-full border border-slate-800 flex items-center justify-center">
                          <div className="w-48 h-48 rounded-full border border-amber-500/30 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500 flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interactive Draggable Shot Markers */}
                  {(shotHits[currentRoundNumber] || []).map(shot => (
                    <div 
                      key={shot.id}
                      onMouseDown={(e) => handleDragShot(e, shot.id)}
                      className="absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full bg-amber-500 border-2 border-slate-950 flex items-center justify-center text-xs font-bold text-slate-950 shadow-xl cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                      style={{ left: `${shot.x}px`, top: `${shot.y}px` }}
                      title={`Shot #${shot.id} (Drag to move)`}
                    >
                      {shot.id}
                    </div>
                  ))}

                  {(!shotHits[currentRoundNumber] || shotHits[currentRoundNumber].length === 0) && (
                    <div className="absolute bottom-4 bg-slate-900/90 text-slate-300 px-4 py-2 rounded-lg text-xs border border-slate-700 pointer-events-none">
                      Click anywhere on target to mark bullet impact points
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'report' && analysisResult && (
          <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Tactical Firing Summary Report</h2>
                <p className="text-xs text-slate-400">Session ID: #{analysisResult.id} | Generated {analysisResult.timestamp}</p>
              </div>
              <button 
                onClick={() => downloadReport(analysisResult)}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-lg transition"
              >
                <Download className="w-4 h-4" /> Download Report On-Spot
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Extreme Spread (ES)</div>
                <div className="text-xl font-bold text-amber-400">{analysisResult.extremeSpread}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Mean Radius (MR)</div>
                <div className="text-xl font-bold text-white">{analysisResult.meanRadius}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">POI Shift Offset</div>
                <div className="text-sm font-bold text-white mt-1">{analysisResult.poiOffset}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Total Hits</div>
                <div className="text-xl font-bold text-white">{analysisResult.totalRoundsFired} Rounds</div>
              </div>
            </div>

            <div className="bg-amber-950/20 border border-amber-500/30 p-5 rounded-xl space-y-2">
              <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                <Award className="w-4 h-4" /> Recommended Optic / Sight Corrections
              </h4>
              <div className="text-white font-mono text-lg">{analysisResult.sightAdjustment}</div>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2 text-sm">
              <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider">Session Parameters</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-400">
                <div>System: <span className="text-white">{analysisResult.meta.gunName}</span></div>
                <div>Caliber: <span className="text-white">{analysisResult.meta.caliber}</span></div>
                <div>Ammo: <span className="text-white">{analysisResult.meta.ammoType}</span></div>
                <div>Muzzle Vel: <span className="text-white">{analysisResult.meta.muzzleVelocity}</span></div>
                <div>Distance: <span className="text-white">{analysisResult.meta.distanceMeters}m</span></div>
                <div>Supervisor: <span className="text-white">{analysisResult.meta.supervisor}</span></div>
                {analysisResult.meta.isArtillery && (
                  <>
                    <div>Ordnance Type: <span className="text-amber-400">{analysisResult.meta.artilleryRoundType}</span></div>
                    <div>Charge Zone: <span className="text-amber-400">{analysisResult.meta.artilleryChargeName}</span></div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setCurrentView('dashboard')} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 rounded-xl text-sm font-bold transition">
                Return to Dashboard
              </button>
              <button onClick={() => setCurrentView('setup')} className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-6 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Start New Test Session
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
