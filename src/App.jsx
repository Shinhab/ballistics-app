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
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
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
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'setup', 'firing', 'report', 'armory'
  
  // Setup Wizard State
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

  // Firing & Target Analysis State
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
  const [targetImages, setTargetImages] = useState({}); // roundNum -> { baselineUrl, postUrl }
  const [shotHits, setShotHits] = useState({}); // roundNum -> [{x, y}]
  const [activeTab, setActiveTab] = useState('setup');
  const [analysisResult, setAnalysisResult] = useState(null);

  // Save states to local storage automatically
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

  // --- ARMORY & AMMO ADDERS ---
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

  // --- SIMULATED COMPUTER VISION SHOT DETECTION ---
  const simulateShotDetection = (roundNum) => {
    // Generate simulated coordinates based on declared rounds
    const hits = [];
    const count = parseInt(sessionMeta.declaredRounds) || 5;
    const centerX = 225; // center of 450px canvas
    const centerY = 200; // center of 400px canvas
    const spread = sessionMeta.isArtillery ? 60 : 25;

    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * spread * (sessionMeta.isArtillery ? 1.8 : 1);
      const offsetY = (Math.random() - 0.5) * spread * (sessionMeta.isArtillery ? 1.8 : 1);
      hits.push({ id: i + 1, x: Math.round(centerX + offsetX), y: Math.round(centerY + offsetY) });
    }

    setShotHits(prev => ({ ...prev, [roundNum]: hits }));
  };

  // --- BALLISTICS CALCULATION ENGINE ---
  const calculateBallistics = () => {
    allRoundsCompleted();
  };

  const allRoundsCompleted = () => {
    // Compile final analysis
    let totalHits = 0;
    let allShotsList = [];
    Object.values(shotHits).forEach(round => {
      totalHits += round.length;
      allShotsList.push(...round);
    });

    // Calculate mock extreme spread and MOA
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

  // --- INSTANT ON-SPOT REPORT DOWNLOAD ---
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
${session.meta.isArtillery ? `- Artillery Round Type: ${session.meta.artilleryRoundType}\n- Charge Name: ${session.meta.artilleryChargeName}\n- Num Charges:${session.meta.artilleryNumCharges}` : ''}
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
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="operator@apex.mil"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Password</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            {authMode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Full Name / Callsign</label>
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    placeholder="Capt. J. Miller"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Role / Clearance</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
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

          <div className="mt-6 text
