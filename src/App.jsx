import React, { useState, useEffect } from 'react';
import { 
  Shield, Crosshair, Target, FileText, Download, User, LogOut, Plus, Trash2, 
  Settings, Award, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, BarChart2,
  Compass, Zap, Database
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

  const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
  const [shotHits, setShotHits] = useState({});
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    localStorage.setItem('apex_armory', JSON.stringify(armory));
  }, [armory]);

  useEffect(() => {
    localStorage.setItem('apex_ammo', JSON.stringify(ammoInventory));
  }, [ammoInventory]);

  useEffect(() => {
    localStorage.setItem('apex_sessions', JSON.stringify(sessions));
  }, [sessions]);

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

  const simulateShotDetection = (roundNum) => {
    const hits = [];
    const count = parseInt(sessionMeta.declaredRounds) || 5;
    const centerX = 225;
    const centerY = 200;
    const spread = sessionMeta.isArtillery ? 60 : 25;

    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * spread * (sessionMeta.isArtillery ? 1.8 : 1);
      const offsetY = (Math.random() - 0.5) * spread * (sessionMeta.isArtillery ? 1.8 : 1);
      hits.push({ id: i + 1, x: Math.round(centerX + offsetX), y: Math.round(centerY + offsetY) });
    }

    setShotHits(prev => ({ ...prev, [roundNum]: hits }));
  };

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

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-10 h-10 text-emerald-500" />
            <div>
              <h1 className="text-xl font-bold tracking-wider text-white">APEX BALLISTICS</h1>
              <p className="text-xs text-neutral-400">Target Scoring & Telemetry System</p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">Email Address</label>
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="operator@apex.mil"
                className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">Password</label>
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            {authMode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">Full Name / Callsign</label>
                  <input 
                    type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Capt. J. Miller"
                    className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">Role / Clearance</label>
                  <select 
                    value={role} onChange={e => setRole(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Shooter">Shooter / Gunner</option>
                    <option value="Supervisor">Range Officer / Supervisor</option>
                    <option value="Administrator">Armorer / Administrator</option>
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-3 rounded-lg transition tracking-wide">
              {authMode === 'login' ? 'ACCESS SYSTEM' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-xs text-emerald-400 hover:underline">
              {authMode === 'login' ? "Don't have an account? Register here" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <Shield className="w-7 h-7 text-emerald-500" />
          <div>
            <h1 className="font-bold tracking-wider text-base text-white">APEX BALLISTICS</h1>
            <p className="text-xs text-neutral-400">Target Scoring & Telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentView('armory')} 
            className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${currentView === 'armory' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-neutral-800 text-neutral-300 hover:bg-neutral-800'}`}
          >
            <Database className="w-4 h-4" /> Armory & Ammo Manager
          </button>
          <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <User className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-neutral-200">{user.fullName}</span>
          </div>
          <button onClick={handleLogout} className="text-neutral-400 hover:text-red-400 p-2" title="Log Out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Dashboard & Range Logs</h2>
                <p className="text-xs text-neutral-400">Manage live firing tests and review tactical session history.</p>
              </div>
              <button 
                onClick={() => setCurrentView('setup')}
                className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs shadow-lg transition"
              >
                <Crosshair className="w-4 h-4" /> Start Firing Test
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                <div className="text-xs text-neutral-400 mb-1">Registered Systems</div>
                <div className="text-2xl font-bold text-white">{armory.length}</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                <div className="text-xs text-neutral-400 mb-1">Ammunition Profiles</div>
                <div className="text-2xl font-bold text-white">{ammoInventory.length}</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                <div className="text-xs text-neutral-400 mb-1">Completed Sessions</div>
                <div className="text-2xl font-bold text-white">{sessions.length}</div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">Historical Test Reports</h3>
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  No firing sessions recorded yet. Click "Start Firing Test" to begin.
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map(s => (
                    <div key={s.id} className="bg-black border border-neutral-800 p-3 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{s.meta.gunName}</span>
                          <span className="text-neutral-400">({s.meta.caliber})</span>
                        </div>
                        <div className="text-neutral-500 mt-0.5">
                          {s.meta.date} | {s.meta.field} | {s.totalRoundsFired} Hits | Spread: {s.extremeSpread}
                        </div>
                      </div>
                      <button 
                        onClick={() => downloadReport(s)} 
                        className="bg-neutral-800 hover:bg-neutral-700 text-emerald-400 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Report
                      </button>
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
                <h2 className="text-xl font-bold text-white">Armory & Ammunition Inventory</h2>
                <p className="text-xs text-neutral-400">Add custom weapons, artillery systems, round types, and powder charges.</p>
              </div>
              <button onClick={() => setCurrentView('dashboard')} className="text-xs text-neutral-400 hover:text-white">
                ← Back to Dashboard
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" /> Firearm / Artillery Systems
                </h3>
                <form onSubmit={addArmoryItem} className="space-y-2.5 bg-black p-3 rounded-lg border border-neutral-800">
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" placeholder="Gun Name (e.g. M4 / Howitzer)" required
                      value={newArmoryItem.name} onChange={e => setNewArmoryItem({...newArmoryItem, name: e.target.value})}
                      className="bg-neutral-900 border border-neutral-800 p-2 rounded text-xs text-white"
                    />
                    <select 
                      value={newArmoryItem.type} onChange={e => setNewArmoryItem({...newArmoryItem, type: e.target.value})}
                      className="bg-neutral-900 border border-neutral-800 p-2 rounded text-xs text-white"
                    >
                      <option value="Firearm">Standard Firearm</option>
                      <option value="Artillery">Artillery Unit</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input 
                      type="text" placeholder="Caliber" required
                      value={newArmoryItem.caliber} onChange={e => setNewArmoryItem({...newArmoryItem, caliber: e.target.value})}
                      className="bg-neutral-900 border border-neutral-800 p-2 rounded text-xs text-white"
                    />
                    <input 
                      type="text" placeholder="Serial ID"
                      value={newArmoryItem.serial} onChange={e => setNewArmoryItem({...newArmoryItem, serial: e.target.value})}
                      className="bg-neutral-900 border border-neutral-800 p-2 rounded text-xs text-white"
                    />
                    <input 
                      type="text" placeholder="Muzzle Vel."
                      value={newArmoryItem.muzzleVelocity} onChange={e => setNewArmoryItem({...newArmoryItem, muzzleVelocity: e.target.value})}
                      className="bg-neutral-900 border border-neutral-800 p-2 rounded text-xs text-white"
                    />
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2 rounded text-xs">
                    Add System
                  </button>
                </form>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {armory.map(item => (
                    <div key={item.id} className="bg-black p-2.5 rounded border border-neutral-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white">{item.name}</span> <span className="text-neutral-400">({item.type})</span>
                        <div className="text-neutral-500">{item.caliber} | {item.muzzleVelocity}</div>
                      </div>
                      <button onClick={() => setArmory(armory.filter(a => a.id !== item.id))} className="text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" /> Ammunition & Charges
                </h3>
                <form onSubmit={addAmmoItem} className="space-y-2.5 bg-black p-3 rounded-lg border border-neutral-800">
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" placeholder="Ammo Name (e.g. M855 / HE Zone)" required
                      value={newAmmoItem.name} onChange={e => setNewAmmoItem({...newAmmoItem, name: e.target.value})}
                      className="bg-neutral-900 border border-neutral-800 p-2 rounded text-xs text-white"
                    />
                    <select 
                      value={newAmmoItem.roundType} onChange={e => setNewAmmoItem({...newAmmoItem, roundType: e.target.value})}
                      className="bg-neutral-900 border border-neutral-800 p-2 rounded text-xs text-white"
                    >
                      <option value="FMJ">FMJ (Full Metal Jacket)</option>
                      <option value="HP">HP (Hollow Point)</option>
                      <option value="AP">AP (Armor Piercing)</option>
                      <option value="Match Grade">Match Grade</option>
                      <option value="Tracer">Tracer</option>
                      <option value="Subsonic">Subsonic</option>
                      <option value="HE (High Explosive)">HE (High Explosive)</option>
                      <option value="Illumination">Illumination Flare</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input 
                      type="text" placeholder="Caliber"
                      value={newAmmoItem.caliber} onChange={e => setNewAmmoItem({...newAmmoItem, caliber: e.target.value})}
                      className="bg-neutral-900 border border-neutral-800 p-2 rounded text-xs text-white"
                    />
                    <input 
                      type="text" placeholder="Bullet Weight"
                      value={newAmmoItem.bulletWeight} onChange={e => setNewAmmoItem({...newAmmoItem, bulletWeight: e.target.value})}
                      className="bg-neutral-900 border border-neutral-800 p-2 rounded text-xs text-white"
                    />
                    <input 
                      type="text" placeholder="Powder Charge"
                      value={newAmmoItem.powderCharge} onChange={e => setNewAmmoItem({...newAmmoItem, powderCharge: e.target.value})}
                      className="bg-neutral-900 border border-neutral-800 p-2 rounded text-xs text-white"
                    />
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2 rounded text-xs">
                    Add Ammunition Profile
                  </button>
                </form>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {ammoInventory.map(ammo => (
                    <div key={ammo.id} className="bg-black p-2.5 rounded border border-neutral-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white">{ammo.name}</span> <span className="text-emerald-400">[{ammo.roundType}]</span>
                        <div className="text-neutral-500">{ammo.caliber} | Wt: {ammo.bulletWeight} | Chg: {ammo.powderCharge}</div>
                      </div>
                      <button onClick={() => setAmmoInventory(ammoInventory.filter(a => a.id !== ammo.id))} className="text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'setup' && (
          <div className="max-w-2xl mx-auto bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Firing Test Parameters</h2>
              <p className="text-xs text-neutral-400">Configure range metadata, weapons, ammunition, and target details.</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Date</label>
                  <input type="date" value={sessionMeta.date} onChange={e => setSessionMeta({...sessionMeta, date: e.target.value})} className="w-full bg-black border border-neutral-800 p-2.5 rounded text-white" />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Time</label>
                  <input type="time" value={sessionMeta.time} onChange={e => setSessionMeta({...sessionMeta, time: e.target.value})} className="w-full bg-black border border-neutral-800 p-2.5 rounded text-white" />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Field Name</label>
                  <input type="text" value={sessionMeta.field} onChange={e => setSessionMeta({...sessionMeta, field: e.target.value})} className="w-full bg-black border border-neutral-800 p-2.5 rounded text-white" />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Supervisor</label>
                  <input type="text" value={sessionMeta.supervisor} onChange={e => setSessionMeta({...sessionMeta, supervisor: e.target.value})} className="w-full bg-black border border-neutral-800 p-2.5 rounded text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Gun System</label>
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
                    className="w-full bg-black border border-neutral-800 p-2.5 rounded text-white"
                  >
                    {armory.map(a => <option key={a.id} value={a.name}>{a.name} ({a.type})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Gun Serial / ID</label>
                  <input type="text" value={sessionMeta.gunNumber} onChange={e => setSessionMeta({...sessionMeta, gunNumber: e.target.value})} className="w-full bg-black border border-neutral-800 p-2.5 rounded text-white" />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Caliber</label>
                  <input type="text" value={sessionMeta.caliber} onChange={e => setSessionMeta({...sessionMeta, caliber: e.target.value})} className="w-full bg-black border border-neutral-800 p-2.5 rounded text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Ammunition Type</label>
                  <select value={sessionMeta.ammoType} onChange={e => setSessionMeta({...sessionMeta, ammoType: e.target.value})} className="w-full bg-black border border-neutral-800 p-2.5 rounded text-white">
                    {ammoInventory.map(am => <option key={am.id} value={am.name}>{am.name} [{am.roundType}]</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Muzzle Velocity</label>
                  <input type="text" value={sessionMeta.muzzleVelocity} onChange={e => setSessionMeta({...sessionMeta, muzzleVelocity: e.target.value})} className="w-full bg-black border border-neutral-800 p-2.5 rounded text-white" />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Rounds per Test Round</label>
                  <input type="number" min="1" max="20" value={sessionMeta.declaredRounds} onChange={e => setSessionMeta({...sessionMeta, declaredRounds: e.target.value})} className="w-full bg-black border border-neutral-800 p-2.5 rounded text-white" />
                </div>
              </div>

              {sessionMeta.isArtillery && (
                <div className="bg-neutral-950 border border-emerald-500/30 p-3 rounded-lg space-y-2">
                  <h4 className="font-bold text-emerald-400 text-xs">Artillery Parameters</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-neutral-500 mb-1">Round Type</label>
                      <select value={sessionMeta.artilleryRoundType} onChange={e => setSessionMeta({...sessionMeta, artilleryRoundType: e.target.value})} className="w-full bg-black border border-neutral-800 p-2 rounded text-white">
                        <option value="HE">HE (High Explosive)</option>
                        <option value="AP">AP (Armor Piercing)</option>
                        <option value="Smoke">Smoke WP</option>
                        <option value="Illumination">Illumination Flare</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-neutral-500 mb-1">Charge Name</label>
                      <input type="text" value={sessionMeta.artilleryChargeName} onChange={e => setSessionMeta({...sessionMeta, artilleryChargeName: e.target.value})} className="w-full bg-black border border-neutral-800 p-2 rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-neutral-500 mb-1">Num Charges</label>
                      <input type="number" min="1" value={sessionMeta.artilleryNumCharges} onChange={e => setSessionMeta({...sessionMeta, artilleryNumCharges: e.target.value})} className="w-full bg-black border border-neutral-800 p-2 rounded text-white" />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Target Type</label>
                  <input type="text" value={sessionMeta.targetType} onChange={e => setSessionMeta({...sessionMeta, targetType: e.target.value})} className="w-full bg-black border border-neutral-800 p-2.5 rounded text-white" />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Width (cm)</label>
                  <input type="number" value={sessionMeta.targetWidthCm} onChange={e => setSessionMeta({...sessionMeta, targetWidthCm: e.target.value})} className="w-full bg-black border border-neutral-800 p-2.5 rounded text-white" />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Height (cm)</label>
                  <input type="number" value={sessionMeta.targetHeightCm} onChange={e => setSessionMeta({...sessionMeta, targetHeightCm: e.target.value})} className="w-full bg-black border border-neutral-800 p-2.5 rounded text-white" />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Distance (m)</label>
                  <input type="number" value={sessionMeta.distanceMeters} onChange={e => setSessionMeta({...sessionMeta, distanceMeters: e.target.value})} className="w-full bg-black border border-neutral-800 p-2.5 rounded text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 bg-black p-3 rounded border border-neutral-800 cursor-pointer">
                  <input type="checkbox" checked={sessionMeta.isNight} onChange={e => setSessionMeta({...sessionMeta, isNight: e.target.checked})} className="accent-emerald-500" />
                  <span>Night Firing</span>
                </label>
                <label className="flex items-center gap-2 bg-black p-3 rounded border border-neutral-800 cursor-pointer">
                  <input type="checkbox" checked={sessionMeta.isMoving} onChange={e => setSessionMeta({...sessionMeta, isMoving: e.target.checked})} className="accent-emerald-500" />
                  <span>Moving Target</span>
                </label>
              </div>

              {sessionMeta.isMoving && (
                <div className="grid grid-cols-3 gap-2 bg-black p-3 rounded border border-neutral-800">
                  <div>
                    <label className="block text-neutral-500 mb-1">Start Dist (m)</label>
                    <input type="number" value={sessionMeta.startDist} onChange={e => setSessionMeta({...sessionMeta, startDist: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-neutral-500 mb-1">Fire Dist (m)</label>
                    <input type="number" value={sessionMeta.fireDist} onChange={e => setSessionMeta({...sessionMeta, fireDist: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-neutral-500 mb-1">Speed (km/h)</label>
                    <input type="number" value={sessionMeta.targetSpeed} onChange={e => setSessionMeta({...sessionMeta, targetSpeed: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded text-white" />
                  </div>
                </div>
              )}

              <button 
                onClick={() => {
                  setCurrentRoundNumber(1);
                  setShotHits({});
                  setCurrentView('firing');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 text-xs transition mt-2"
              >
                Proceed to Firing & Analysis <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentView === 'firing' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-3 rounded-xl text-xs">
              <div>
                <h2 className="font-bold text-white">Round #{currentRoundNumber} Firing Phase</h2>
                <p className="text-neutral-400">{sessionMeta.gunName} | Caliber: {sessionMeta.caliber}</p>
              </div>
              <button onClick={() => setCurrentView('setup')} className="text-neutral-400 hover:text-white">Edit Setup</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-3">
                <Target className="w-12 h-12 text-emerald-500 opacity-80" />
                <div>
                  <h3 className="font-bold text-white text-sm">Upload Target Photo</h3>
                  <p className="text-xs text-neutral-400">Upload post-firing image for Round #{currentRoundNumber}.</p>
                </div>
                <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-emerald-400 font-bold px-4 py-2.5 rounded-lg border border-neutral-700 text-xs transition">
                  <span>Select Target File</span>
                  <input type="file" accept="image/*" className="hidden" onChange={() => simulateShotDetection(currentRoundNumber)} />
                </label>
                <button onClick={() => simulateShotDetection(currentRoundNumber)} className="text-[10px] text-neutral-400 hover:text-emerald-400 underline">
                  [Simulate Auto-Detection]
                </button>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Target Hit Detection</span>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px]">
                    {shotHits[currentRoundNumber]?.length || 0} / {sessionMeta.declaredRounds} Hits
                  </span>
                </div>

                <div className="relative w-full h-56 bg-black border border-neutral-800 rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="absolute w-40 h-40 rounded-full border border-neutral-800 flex items-center justify-center">
                    <div className="absolute w-24 h-24 rounded-full border border-emerald-500/30 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      </div>
                    </div>
                  </div>

                  {(shotHits[currentRoundNumber] || []).map(shot => (
                    <div 
                      key={shot.id} 
                      className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-emerald-500 border border-black flex items-center justify-center text-[9px] font-bold text-black shadow"
                      style={{ left: `${shot.x}px`, top: `${shot.y}px` }}
                    >
                      {shot.id}
                    </div>
                  ))}

                  {(!shotHits[currentRoundNumber] || shotHits[currentRoundNumber].length === 0) && (
                    <div className="text-[10px] text-neutral-500 z-10">Upload photo to view hits</div>
                  )}
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
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2.5 rounded-lg text-xs transition"
                >
                  Confirm Round & Continue / Finish
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'report' && analysisResult && (
          <div className="max-w-2xl mx-auto bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h2 className="font-bold text-white text-sm">Tactical Firing Summary Report</h2>
                <p className="text-neutral-400">Generated {analysisResult.timestamp}</p>
              </div>
              <button 
                onClick={() => downloadReport(analysisResult)}
                className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download Report On-Spot
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-black p-3 rounded-lg border border-neutral-800">
                <div className="text-neutral-400 mb-0.5">Extreme Spread</div>
                <div className="text-sm font-bold text-emerald-400">{analysisResult.extremeSpread}</div>
              </div>
              <div className="bg-black p-3 rounded-lg border border-neutral-800">
                <div className="text-neutral-400 mb-0.5">Mean Radius</div>
                <div className="text-sm font-bold text-white">{analysisResult.meanRadius}</div>
              </div>
              <div className="bg-black p-3 rounded-lg border border-neutral-800">
                <div className="text-neutral-400 mb-0.5">POI Offset</div>
                <div className="text-xs font-bold text-white mt-1">{analysisResult.poiOffset}</div>
              </div>
              <div className="bg-black p-3 rounded-lg border border-neutral-800">
                <div className="text-neutral-400 mb-0.5">Total Hits</div>
                <div className="text-sm font-bold text-white">{analysisResult.totalRoundsFired} Rounds</div>
              </div>
            </div>

            <div className="bg-neutral-950 border border-emerald-500/30 p-3.5 rounded-lg space-y-1">
              <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Recommended Optic Corrections
              </h4>
              <div className="text-white font-mono text-sm">{analysisResult.sightAdjustment}</div>
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={() => setCurrentView('dashboard')} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2 rounded font-bold transition">
                Dashboard
              </button>
              <button onClick={() => setCurrentView('setup')} className="bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 rounded font-bold transition flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> New Test
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
