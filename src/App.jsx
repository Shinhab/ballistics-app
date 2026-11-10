import React, { useState, useEffect, useRef } from 'react';
import { 
  Target, Crosshair, Shield, User, Plus, Trash2, Edit3, Download, Mail, 
  ChevronRight, ChevronLeft, Check, AlertCircle, Eye, RefreshCw, Calendar, 
  Clock, MapPin, Award, Activity, Layers, Play, CheckCircle2, FileText, 
  Settings, LogOut, ArrowUpRight, Maximize2, Move, ZoomIn, Lock, Database
} from 'lucide-react';

// --- SAMPLE TARGET PRESETS ---
const TARGET_PRESETS = [
  { id: 'bullseye', name: 'Standard Bullseye (10-Ring)', defaultW: 50, defaultH: 50, unit: 'cm' },
  { id: 'ipsc', name: 'IPSC / USPSA Silhouette', defaultW: 45, defaultH: 75, unit: 'cm' },
  { id: 'nato', name: 'NATO E-Type Silhouette', defaultW: 50, defaultH: 100, unit: 'cm' },
  { id: 'custom', name: 'Custom Target Dimensions', defaultW: 60, defaultH: 60, unit: 'cm' }
];

const INITIAL_INVENTORY = [
  { id: '1', name: 'Sniper System Alpha', serial: 'SN-9982-X', caliber: '7.62x51mm NATO', velocity: 820, unit: 'm/s' },
  { id: '2', name: 'Tactical Rifle MK12', serial: 'MK-4412-B', caliber: '5.56x45mm NATO', velocity: 940, unit: 'm/s' },
  { id: '3', name: 'Precision Pistol 9', serial: 'P9-0012-C', caliber: '9x19mm Parabellum', velocity: 360, unit: 'm/s' }
];

export default function App() {
  // --- AUTHENTICATION & USERS STATE ---
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup'
  const [usersDb, setUsersDb] = useState(() => {
    const saved = localStorage.getItem('apex_ballistics_users');
    return saved ? JSON.parse(saved) : [{ email: 'admin@apex.org', pass: 'admin123', name: 'Capt. Alex Vance', rank: 'Range Master' }];
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('apex_ballistics_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');

  // --- APP NAVIGATION & STORAGE STATE ---
  const [activeTab, setActiveTab] = useState('new-session'); // 'new-session', 'history', 'inventory'
  
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('apex_ballistics_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [sessionsHistory, setSessionsHistory] = useState(() => {
    const saved = localStorage.getItem('apex_ballistics_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  // --- WIZARD FORM STATE ---
  const [step, setStep] = useState(1); // 1: Setup Metadata, 2: Baseline Photo, 3: Round Shooting & CV, 4: Round Complete, 5: Final Report

  const [metadata, setMetadata] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    fieldName: 'Bravo Range - Range 4B',
    supervisor: 'Lt. Colonel Thomas Thorne',
    gunName: 'Sniper System Alpha',
    gunSerial: 'SN-9982-X',
    caliber: '7.62x51mm NATO',
    ammoType: 'M118LR 175gr Match King',
    muzzleVelocity: 820,
    velocityUnit: 'm/s',
    targetType: 'bullseye',
    targetWidth: 50,
    targetHeight: 50,
    dimensionUnit: 'cm',
    roundsToFire: 5,
    distance: 100,
    distanceUnit: 'm',
    dayNight: 'Day',
    isMovingTarget: false,
    movingStartDist: 120,
    movingImpactDist: 100,
    movingSpeed: 15,
    movingDirection: 'Left to Right'
  });

  const [baselineImage, setBaselineImage] = useState(null);
  const [rounds, setRounds] = useState([]); 
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRoundPhoto, setCurrentRoundPhoto] = useState(null);
  const [currentHits, setCurrentHits] = useState([]); 
  const [selectedHitId, setSelectedHitId] = useState(null);
  const [isManualAdjustMode, setIsManualAdjustMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Email & Toast Modals
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedHistorySession, setSelectedHistorySession] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('apex_ballistics_users', JSON.stringify(usersDb));
  }, [usersDb]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('apex_ballistics_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('apex_ballistics_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('apex_ballistics_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('apex_ballistics_sessions', JSON.stringify(sessionsHistory));
  }, [sessionsHistory]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // AUTH HANDLERS
  const handleLogin = (e) => {
    e.preventDefault();
    const found = usersDb.find(u => u.email === loginEmail && u.pass === loginPass);
    if (found) {
      setCurrentUser(found);
      setToastMessage(`Welcome back, ${found.name}`);
    } else {
      setToastMessage('Invalid email or password. Please try again.');
    }
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (!signupEmail || !signupPass || !signupName) return;
    if (usersDb.some(u => u.email === signupEmail)) {
      setToastMessage('User with this email already exists.');
      return;
    }
    const newUser = { email: signupEmail, pass: signupPass, name: signupName, rank: 'Operator' };
    setUsersDb([...usersDb, newUser]);
    setCurrentUser(newUser);
    setToastMessage('Account created successfully!');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('login');
    setToastMessage('Logged out successfully.');
  };

  const handleSelectFirearm = (firearm) => {
    setMetadata(prev => ({
      ...prev,
      gunName: firearm.name,
      gunSerial: firearm.serial,
      caliber: firearm.caliber,
      muzzleVelocity: firearm.velocity,
      velocityUnit: firearm.unit
    }));
    setToastMessage(`Loaded firearm profile: ${firearm.name}`);
  };

  const generateSyntheticTarget = (type) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 600, 600);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 600; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(600, i); ctx.stroke();
    }

    const cx = 300;
    const cy = 300;

    if (type === 'ipsc' || type === 'nato') {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(150, 100, 300, 420, [40, 40, 10, 10]);
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(220, 200, 160, 220);
      ctx.strokeRect(240, 120, 120, 70);
    } else {
      const rings = [240, 190, 140, 90, 45, 20];
      const colors = ['#000', '#fff', '#000', '#fff', '#000', '#ef4444'];
      
      rings.forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = colors[idx];
        ctx.fill();
        ctx.strokeStyle = idx % 2 === 0 ? '#cbd5e1' : '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 20, cy); ctx.lineTo(cx + 20, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy + 20); ctx.stroke();

    return canvas.toDataURL();
  };

  const handleProceedFromSetup = () => {
    if (!baselineImage) {
      setBaselineImage(generateSyntheticTarget(metadata.targetType));
    }
    setStep(2);
  };

  const handleProcessRoundImage = (photoDataUrl) => {
    setCurrentRoundPhoto(photoDataUrl);
    const roundsCount = parseInt(metadata.roundsToFire) || 5;
    const detectedCount = Math.random() > 0.3 ? roundsCount : Math.max(1, roundsCount - 1);
    
    const simulatedHits = [];
    for (let i = 0; i < detectedCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radiusPercent = (Math.random() * 12) + 2; 
      const x = 50 + Math.cos(angle) * radiusPercent;
      const y = 50 + Math.sin(angle) * radiusPercent;
      
      simulatedHits.push({
        id: `hit-${currentRoundIndex + 1}-${i + 1}-${Date.now()}`,
        x: parseFloat(x.toFixed(2)),
        y: parseFloat(y.toFixed(2)),
        roundNum: currentRoundIndex + 1
      });
    }

    setCurrentHits(simulatedHits);
    if (detectedCount < roundsCount) {
      setToastMessage(`AI Detected ${detectedCount} of ${roundsCount} expected shots. Manual confirmation recommended.`);
    } else {
      setToastMessage(`AI Shot Detection Complete: ${detectedCount} bullet impacts found.`);
    }
    setStep(3);
  };

  const handleTargetClick = (e, rect) => {
    if (!isManualAdjustMode) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const percentX = parseFloat(((clickX / rect.width) * 100).toFixed(2));
    const percentY = parseFloat(((clickY / rect.height) * 100).toFixed(2));

    const newHit = {
      id: `hit-manual-${Date.now()}`,
      x: percentX,
      y: percentY,
      roundNum: currentRoundIndex + 1
    };

    setCurrentHits(prev => [...prev, newHit]);
    setSelectedHitId(newHit.id);
    setToastMessage("Manual bullet impact added.");
  };

  const handleRemoveHit = (id) => {
    setCurrentHits(prev => prev.filter(h => h.id !== id));
    if (selectedHitId === id) setSelectedHitId(null);
  };

  const calculateBallistics = (hits, meta) => {
    if (!hits || hits.length === 0) {
      return { esPhysical: 0, mrPhysical: 0, moa: 0, mrad: 0, poiX: 0, poiY: 0, recommendation: 'No shots recorded' };
    }

    const tWidth = parseFloat(meta.targetWidth) || 50; 
    const dist = parseFloat(meta.distance) || 100; 

    const shotsPhysical = hits.map(h => ({
      x: ((h.x - 50) / 100) * tWidth,
      y: ((h.y - 50) / 100) * meta.targetHeight,
      rawX: h.x,
      rawY: h.y
    }));

    const avgX = shotsPhysical.reduce((acc, s) => acc + s.x, 0) / shotsPhysical.length;
    const avgY = shotsPhysical.reduce((acc, s) => acc + s.y, 0) / shotsPhysical.length;

    let maxDist = 0;
    for (let i = 0; i < shotsPhysical.length; i++) {
      for (let j = i + 1; j < shotsPhysical.length; j++) {
        const d = Math.hypot(shotsPhysical[i].x - shotsPhysical[j].x, shotsPhysical[i].y - shotsPhysical[j].y);
        if (d > maxDist) maxDist = d;
      }
    }

    const sumDistFromPOI = shotsPhysical.reduce((acc, s) => {
      return acc + Math.hypot(s.x - avgX, s.y - avgY);
    }, 0);
    const meanRadius = sumDistFromPOI / shotsPhysical.length;

    const sizeInInches = meta.dimensionUnit === 'cm' ? maxDist * 0.393701 : maxDist;
    const distInYards = meta.distanceUnit === 'm' ? dist * 1.09361 : dist;
    
    const moa = distInYards > 0 ? (sizeInInches / (distInYards * 0.01047)) : 0;
    const mrad = moa * 0.290888;

    const poiXInches = meta.dimensionUnit === 'cm' ? avgX * 0.393701 : avgX;
    const poiYInches = meta.dimensionUnit === 'cm' ? avgY * 0.393701 : avgY;
    const adjustMoaX = distInYards > 0 ? (poiXInches / (distInYards * 0.01047)) : 0;
    const adjustMoaY = distInYards > 0 ? (poiYInches / (distInYards * 0.01047)) : 0;

    let dirX = adjustMoaX > 0 ? 'LEFT' : 'RIGHT';
    let dirY = adjustMoaY > 0 ? 'DOWN' : 'UP';

    const recommendation = `Adjust Sight: ${dirY} ${Math.abs(adjustMoaY).toFixed(1)} MOA, ${dirX} ${Math.abs(adjustMoaX).toFixed(1)} MOA`;

    return {
      esPhysical: maxDist.toFixed(2),
      mrPhysical: meanRadius.toFixed(2),
      moa: moa.toFixed(2),
      mrad: mrad.toFixed(2),
      poiX: avgX.toFixed(2),
      poiY: avgY.toFixed(2),
      adjustMoaX: Math.abs(adjustMoaX).toFixed(1),
      adjustMoaY: Math.abs(adjustMoaY).toFixed(1),
      dirX,
      dirY,
      recommendation
    };
  };

  const handleConfirmRound = () => {
    const stats = calculateBallistics(currentHits, metadata);
    const roundData = {
      roundNumber: currentRoundIndex + 1,
      photoUrl: currentRoundPhoto || baselineImage,
      hits: [...currentHits],
      stats,
      roundsFired: metadata.roundsToFire,
      timestamp: new Date().toLocaleTimeString()
    };

    setRounds(prev => [...prev, roundData]);
    setStep(4); 
  };

  const handleStartNextRound = () => {
    setCurrentRoundIndex(prev => prev + 1);
    setCurrentRoundPhoto(null);
    setCurrentHits([]);
    setStep(3); 
  };

  const handleFinishSession = () => {
    const allHits = rounds.flatMap(r => r.hits);
    const overallStats = calculateBallistics(allHits, metadata);

    const fullSession = {
      id: `SESS-${Date.now().toString().slice(-6)}`,
      user: currentUser.name,
      metadata: { ...metadata },
      baselineImage,
      rounds: [...rounds],
      overallStats,
      totalRoundsFired: rounds.length * parseInt(metadata.roundsToFire),
      createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
    };

    setSessionsHistory(prev => [fullSession, ...prev]);
    setSelectedHistorySession(fullSession);
    setStep(5); 
    setToastMessage("Session securely saved to persistent storage.");
  };

  const handleStartNewSession = () => {
    setStep(1);
    setBaselineImage(null);
    setRounds([]);
    setCurrentRoundIndex(0);
    setCurrentRoundPhoto(null);
    setCurrentHits([]);
    setSelectedHistorySession(null);
    setActiveTab('new-session');
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    if (!emailAddress) return;
    setShowEmailModal(false);
    setToastMessage(`Ballistic Analysis Report dispatched securely to ${emailAddress}`);
    setEmailAddress('');
  };

  // --- RENDER LOGIN/SIGNUP SCREEN IF NOT AUTHENTICATED ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4">
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-slate-950 px-4 py-3 rounded-lg shadow-xl font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center mx-auto text-emerald-400">
              <Crosshair className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-wide">APEX BALLISTICS</h1>
            <p className="text-xs text-slate-400">Secure Target Scoring & Telemetry Platform</p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${authMode === 'login' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${authMode === 'signup' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Create Account
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="admin@apex.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-950"
              >
                Access Account
              </button>
              <div className="text-center text-[11px] text-slate-500">
                Demo Account: <code className="text-emerald-400">admin@apex.org</code> / <code className="text-emerald-400">admin123</code>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name / Operator ID</label>
                <input 
                  type="text" 
                  required
                  value={signupName}
                  onChange={e => setSignupName(e.target.value)}
                  placeholder="Capt. John Miller"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  placeholder="operator@unit.mil"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={signupPass}
                  onChange={e => setSignupPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-950"
              >
                Register & Initialize History
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- MAIN APP WORKSPACE ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-slate-950 px-4 py-3 rounded-lg shadow-xl font-medium flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER / COMMAND BAR */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg text-emerald-400">
              <Crosshair className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-100 tracking-wide flex items-center gap-2">
                APEX BALLISTICS <span className="text-xs font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">CLOUD READY</span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">Persistent User History & Automated Telemetry</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-3">
            <button
              onClick={() => { setActiveTab('new-session'); if (step === 5) handleStartNewSession(); }}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'new-session' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>New Test</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'history' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>History Archive ({sessionsHistory.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'inventory' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Armory</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
            <div className="text-right hidden lg:block text-xs">
              <div className="font-semibold text-slate-200">{currentUser.name}</div>
              <div className="text-emerald-400 text-[10px]">{currentUser.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {activeTab === 'new-session' && (
          <div className="space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
                <span className={step >= 1 ? 'text-emerald-400' : ''}>1. SETUP PARAMETERS</span>
                <span className={step >= 2 ? 'text-emerald-400' : ''}>2. BASELINE TARGET</span>
                <span className={step >= 3 ? 'text-emerald-400' : ''}>3. SHOT ANALYSIS</span>
                <span className={step >= 4 ? 'text-emerald-400' : ''}>4. MULTI-ROUND</span>
                <span className={step >= 5 ? 'text-emerald-400' : ''}>5. FINAL REPORT</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${(step / 5) * 100}%` }}
                />
              </div>
            </div>

            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                  <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-emerald-400" />
                        Firing Test & Ammunition Parameters
                      </h2>
                      <p className="text-xs text-slate-400">Configure weapon telemetry, muzzle velocity, and physical target dimensions.</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-3 font-semibold">1. Range & Supervisor Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Date & Time</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="date"
                            value={metadata.date}
                            onChange={e => setMetadata({...metadata, date: e.target.value})}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                          <input 
                            type="time"
                            value={metadata.time}
                            onChange={e => setMetadata({...metadata, time: e.target.value})}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Field / Range Location</label>
                        <input 
                          type="text"
                          value={metadata.fieldName}
                          onChange={e => setMetadata({...metadata, fieldName: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-300 mb-1">Supervisor / Range Officer Name</label>
                        <input 
                          type="text"
                          value={metadata.supervisor}
                          onChange={e => setMetadata({...metadata, supervisor: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-3 font-semibold">2. Firearm & Ballistics Data</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Gun Name / Model</label>
                        <input 
                          type="text"
                          value={metadata.gunName}
                          onChange={e => setMetadata({...metadata, gunName: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Gun Serial / ID #</label>
                        <input 
                          type="text"
                          value={metadata.gunSerial}
                          onChange={e => setMetadata({...metadata, gunSerial: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Caliber</label>
                        <input 
                          type="text"
                          value={metadata.caliber}
                          onChange={e => setMetadata({...metadata, caliber: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Ammunition Type / Brand</label>
                        <input 
                          type="text"
                          value={metadata.ammoType}
                          onChange={e => setMetadata({...metadata, ammoType: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Muzzle Velocity</label>
                        <div className="flex space-x-1">
                          <input 
                            type="number"
                            value={metadata.muzzleVelocity}
                            onChange={e => setMetadata({...metadata, muzzleVelocity: e.target.value})}
                            className="w-2/3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                          <select
                            value={metadata.velocityUnit}
                            onChange={e => setMetadata({...metadata, velocityUnit: e.target.value})}
                            className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-200 focus:border-emerald-500"
                          >
                            <option value="m/s">m/s</option>
                            <option value="ft/s">ft/s</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Rounds per Session</label>
                        <input 
                          type="number"
                          value={metadata.roundsToFire}
                          onChange={e => setMetadata({...metadata, roundsToFire: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-3 font-semibold">3. Target Geometry & Dimensions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Target Model</label>
                        <select
                          value={metadata.targetType}
                          onChange={e => {
                            const p = TARGET_PRESETS.find(pr => pr.id === e.target.value);
                            setMetadata({
                              ...metadata,
                              targetType: e.target.value,
                              targetWidth: p ? p.defaultW : metadata.targetWidth,
                              targetHeight: p ? p.defaultH : metadata.targetHeight,
                              dimensionUnit: p ? p.unit : metadata.dimensionUnit
                            });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500"
                        >
                          {TARGET_PRESETS.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Dimensions (W × H)</label>
                        <div className="flex space-x-1 items-center">
                          <input 
                            type="number"
                            value={metadata.targetWidth}
                            onChange={e => setMetadata({...metadata, targetWidth: e.target.value})}
                            className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-200"
                          />
                          <span className="text-slate-500 text-xs">×</span>
                          <input 
                            type="number"
                            value={metadata.targetHeight}
                            onChange={e => setMetadata({...metadata, targetHeight: e.target.value})}
                            className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-200"
                          />
                          <select
                            value={metadata.dimensionUnit}
                            onChange={e => setMetadata({...metadata, dimensionUnit: e.target.value})}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-200"
                          >
                            <option value="cm">cm</option>
                            <option value="inches">in</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Firing Distance</label>
                        <div className="flex space-x-1">
                          <input 
                            type="number"
                            value={metadata.distance}
                            onChange={e => setMetadata({...metadata, distance: e.target.value})}
                            className="w-2/3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                          />
                          <select
                            value={metadata.distanceUnit}
                            onChange={e => setMetadata({...metadata, distanceUnit: e.target.value})}
                            className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-200"
                          >
                            <option value="m">m</option>
                            <option value="yards">yds</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Day / Night Conditions</label>
                        <select
                          value={metadata.dayNight}
                          onChange={e => setMetadata({...metadata, dayNight: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                        >
                          <option value="Day">Daylight Operations</option>
                          <option value="Night (NVG)">Night / NVG Operations</option>
                          <option value="Low Light">Low Light / Twilight</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-slate-200 block">Moving Target Test</span>
                          <span className="text-[11px] text-slate-400">Target changes range or moves during firing sequence</span>
                        </div>
                        <input 
                          type="checkbox"
                          checked={metadata.isMovingTarget}
                          onChange={e => setMetadata({...metadata, isMovingTarget: e.target.checked})}
                          className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {metadata.isMovingTarget && (
                      <div className="mt-4 p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-emerald-300 mb-1">Starting Distance</label>
                          <input 
                            type="number"
                            value={metadata.movingStartDist}
                            onChange={e => setMetadata({...metadata, movingStartDist: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-emerald-300 mb-1">Firing Impact Distance</label>
                          <input 
                            type="number"
                            value={metadata.movingImpactDist}
                            onChange={e => setMetadata({...metadata, movingImpactDist: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-emerald-300 mb-1">Target Speed (km/h)</label>
                          <input 
                            type="number"
                            value={metadata.movingSpeed}
                            onChange={e => setMetadata({...metadata, movingSpeed: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-emerald-300 mb-1">Movement Direction</label>
                          <select
                            value={metadata.movingDirection}
                            onChange={e => setMetadata({...metadata, movingDirection: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-200"
                          >
                            <option value="Left to Right">Left to Right</option>
                            <option value="Right to Left">Right to Left</option>
                            <option value="Inbound / Approaching">Inbound / Approaching</option>
                            <option value="Outbound / Receding">Outbound / Receding</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={handleProceedFromSetup}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center space-x-2 transition shadow-lg shadow-emerald-950"
                    >
                      <span>Proceed to Baseline Target Capture</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 h-fit">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      Saved Armory Inventory
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Quick Load</span>
                  </h3>
                  <p className="text-xs text-slate-400">Click a weapon profile to instantly load its ballistics configuration.</p>

                  <div className="space-y-2">
                    {inventory.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectFirearm(item)}
                        className={`p-3 rounded-lg border cursor-pointer transition ${
                          metadata.gunSerial === item.serial 
                            ? 'bg-emerald-950/40 border-emerald-500/60' 
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                          <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400">{item.caliber}</span>
                        </div>
                        <div className="mt-2 text-[11px] text-slate-400 flex justify-between">
                          <span>SN: {item.serial}</span>
                          <span>{item.velocity} {item.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setActiveTab('inventory')}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-medium flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Manage Armory Inventory</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {step === 2 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-emerald-400" />
                      Step 2: Baseline Un-shot Target Capture
                    </h2>
                    <p className="text-xs text-slate-400">Provide or upload clean target photo for physical calibration.</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="flex flex-col items-center justify-center bg-slate-950 p-6 rounded-xl border border-slate-800 relative">
                    <div className="relative border-2 border-dashed border-slate-700 rounded-lg p-2 max-w-sm w-full bg-slate-900/50">
                      <img 
                        src={baselineImage || generateSyntheticTarget(metadata.targetType)} 
                        alt="Baseline Target" 
                        className="w-full h-auto rounded object-contain shadow-2xl"
                      />
                      <div className="absolute top-4 right-4 bg-slate-950/90 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono px-2 py-1 rounded">
                        {metadata.targetWidth} × {metadata.targetHeight} {metadata.dimensionUnit}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                      <h3 className="text-sm font-semibold text-slate-200">Upload Baseline Target Image</h3>
                      <label className="block w-full border border-dashed border-slate-700 hover:border-emerald-500 rounded-lg p-4 text-center cursor-pointer transition bg-slate-900/40">
                        <span className="text-xs font-medium text-slate-300 block">Click to Upload Baseline Target Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setBaselineImage(event.target.result);
                                setToastMessage("Custom baseline image uploaded.");
                              };
                              reader.readAsDataURL(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <button
                      onClick={() => {
                        if (!baselineImage) setBaselineImage(generateSyntheticTarget(metadata.targetType));
                        setStep(3);
                        setTimeout(() => {
                          handleProcessRoundImage(baselineImage || generateSyntheticTarget(metadata.targetType));
                        }, 300);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Confirm Baseline & Begin Round 1 Firing</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono px-2 py-0.5 rounded font-bold">
                        ROUND {currentRoundIndex + 1}
                      </span>
                      <h2 className="text-lg font-bold text-slate-100">
                        Optical Shot Analysis & Manual Confirmation
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Target: {metadata.gunName} ({metadata.caliber}) @ {metadata.distance} {metadata.distanceUnit}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition flex items-center space-x-1.5">
                      <span>Upload Post-Fire Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = (event) => handleProcessRoundImage(event.target.result);
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    <button
                      onClick={() => handleProcessRoundImage(baselineImage || generateSyntheticTarget(metadata.targetType))}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Re-Simulate</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  <div className="lg:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                    
                    <div className="w-full flex items-center justify-between mb-3 text-xs bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setIsManualAdjustMode(!isManualAdjustMode)}
                        className={`px-3 py-1 rounded text-xs font-medium transition flex items-center space-x-1 ${
                          isManualAdjustMode ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isManualAdjustMode ? 'Manual Adjust Active (Click Target)' : 'Enable Manual Adjust'}</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 text-[11px]">Zoom:</span>
                        <button onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.25))} className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">-</button>
                        <span className="text-slate-200 font-mono text-[11px]">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => setZoomLevel(Math.min(2.5, zoomLevel + 0.25))} className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">+</button>
                      </div>
                    </div>

                    <div className="overflow-auto max-w-full flex justify-center p-2">
                      <div 
                        className="relative cursor-crosshair border border-slate-700 shadow-2xl transition-transform duration-200"
                        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          handleTargetClick(e, rect);
                        }}
                      >
                        <img 
                          src={currentRoundPhoto || baselineImage || generateSyntheticTarget(metadata.targetType)} 
                          alt="Round Target"
                          className="w-[450px] h-[450px] object-contain select-none"
                        />

                        {currentHits.map((hit, idx) => {
                          const isSelected = selectedHitId === hit.id;
                          return (
                            <div
                              key={hit.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHitId(hit.id);
                              }}
                              style={{ left: `${hit.x}%`, top: `${hit.y}%` }}
                              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                            >
                              <div className={`relative flex items-center justify-center w-7 h-7 rounded-full border-2 transition ${
                                isSelected ? 'bg-amber-500/40 border-amber-400 scale-125 z-30 shadow-lg' : 'bg-emerald-500/30 border-emerald-400 z-20'
                              }`}>
                                <span className="text-[10px] font-bold text-white font-mono">{idx + 1}</span>
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-emerald-400 font-bold text-xs pointer-events-none">▼</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          Impact Coordinates ({currentHits.length}/{metadata.roundsToFire})
                        </h3>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {currentHits.map((hit, idx) => (
                          <div 
                            key={hit.id}
                            onClick={() => setSelectedHitId(hit.id)}
                            className={`p-2 rounded-lg text-xs font-mono flex items-center justify-between cursor-pointer border transition ${
                              selectedHitId === hit.id ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span>#{idx + 1} | X: {hit.x}% Y: {hit.y}%</span>
                            <button onClick={(e) => { e.stopPropagation(); handleRemoveHit(hit.id); }} className="text-slate-500 hover:text-red-400 p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {currentHits.length > 0 && (
                      <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Ballistics Preview</h4>
                        {(() => {
                          const stats = calculateBallistics(currentHits, metadata);
                          return (
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                              <div>Group MOA: <span className="text-emerald-400 font-bold">{stats.moa}</span></div>
                              <div>Spread: <span className="text-emerald-400 font-bold">{stats.esPhysical} {metadata.dimensionUnit}</span></div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <button
                      onClick={handleConfirmRound}
                      disabled={currentHits.length === 0}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Lock Round {currentRoundIndex + 1}</span>
                    </button>
                  </div>

                </div>

              </div>
            )}

            {step === 4 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-2xl mx-auto text-center space-y-6 shadow-2xl">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-100">Round {currentRoundIndex + 1} Successfully Recorded</h2>
                  <p className="text-xs text-slate-400 mt-1">Data saved to persistent session buffer.</p>
                </div>

                <div className="border-t border-slate-800 pt-6">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">Would you like to conduct another round of firing?</h3>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={handleStartNextRound}
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Yes, Start Round {currentRoundIndex + 2}</span>
                    </button>
                    <button
                      onClick={handleFinishSession}
                      className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>No, Generate Final Report</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && selectedHistorySession && (
              <FinalReportView 
                session={selectedHistorySession} 
                onStartNew={handleStartNewSession}
                onOpenEmailModal={() => setShowEmailModal(true)}
              />
            )}

          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    Persistent User History Archive ({sessionsHistory.length})
                  </h2>
                  <p className="text-xs text-slate-400">All historical test records stored securely.</p>
                </div>
                <button
                  onClick={handleStartNewSession}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Firing Test</span>
                </button>
              </div>

              {sessionsHistory.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Activity className="w-12 h-12 text-slate-700 mx-auto" />
                  <p className="text-sm text-slate-400">No saved history found. Complete a firing test to store records.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessionsHistory.map(sess => (
                      <div 
                        key={sess.id}
                        onClick={() => setSelectedHistorySession(sess)}
                        className={`p-4 rounded-xl border cursor-pointer transition ${
                          selectedHistorySession?.id === sess.id ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                          <span className="font-mono text-xs font-bold text-emerald-400">{sess.id}</span>
                          <span className="text-[10px] text-slate-400">{sess.createdAt}</span>
                        </div>
                        <div className="space-y-1 text-xs text-slate-300">
                          <div className="font-semibold text-slate-100">{sess.metadata.gunName}</div>
                          <div className="text-[11px] text-slate-400">Caliber: {sess.metadata.caliber}</div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
                          <span className="text-slate-400">Group: <strong className="text-emerald-400">{sess.overallStats.moa} MOA</strong></span>
                          <span className="text-slate-400">Rounds: {sess.totalRoundsFired}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedHistorySession && (
                    <div className="mt-8 border-t border-slate-800 pt-8">
                      <FinalReportView 
                        session={selectedHistorySession} 
                        onStartNew={handleStartNewSession}
                        onOpenEmailModal={() => setShowEmailModal(true)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  Saved Firearms Armory Database
                </h2>
                <p className="text-xs text-slate-400">Stored persistently for quick session selection.</p>
              </div>

              <button
                onClick={() => {
                  const newItem = {
                    id: Date.now().toString(),
                    name: 'Custom Precision Rifle',
                    serial: `SN-${Math.floor(1000 + Math.random() * 9000)}`,
                    caliber: '6.5 Creedmoor',
                    velocity: 820,
                    unit: 'm/s'
                  };
                  setInventory([newItem, ...inventory]);
                  setToastMessage("Added firearm to armory.");
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Firearm</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map(item => (
                <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">{item.name}</h3>
                      <p className="text-xs font-mono text-emerald-400">{item.caliber}</p>
                    </div>
                    <button onClick={() => setInventory(inventory.filter(i => i.id !== item.id))} className="text-slate-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1 text-xs text-slate-400 font-mono">
                    <div>Serial #: <span className="text-slate-200">{item.serial}</span></div>
                    <div>Velocity: <span className="text-slate-200">{item.velocity} {item.unit}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                Dispatch Tactical Report
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Recipient Email</label>
                <input 
                  type="email" 
                  required
                  value={emailAddress}
                  onChange={e => setEmailAddress(e.target.value)}
                  placeholder="supervisor@range-command.gov"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowEmailModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-xs rounded-lg font-bold">Send Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function FinalReportView({ session, onStartNew, onOpenEmailModal }) {
  const meta = session.metadata;
  const stats = session.overallStats;

  const handleExportCSV = () => {
    let csv = 'Round,Hit,X_Coord,Y_Coord,MOA,Extreme_Spread\n';
    session.rounds.forEach(r => {
      r.hits.forEach((h, i) => {
        csv += `${r.roundNumber},${i+1},${h.x},${h.y},${r.stats.moa},${r.stats.esPhysical}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ballistics_Report_${session.id}.csv`;
    a.click();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-8 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-6 gap-4 print:hidden">
        <div>
          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
            STORED RECORD ID: {session.id}
          </span>
          <h2 className="text-xl font-bold text-slate-100 mt-1">Official Ballistic Evaluation & Target Telemetry Report</h2>
          <p className="text-xs text-slate-400">Generated on {session.createdAt} by {session.user}</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Excel CSV</span>
          </button>

          <button
            onClick={onOpenEmailModal}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>Email Report</span>
          </button>

          <button
            onClick={onStartNew}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>New Test Session</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950 p-6 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold mb-3">Firearm & Ammo Specification</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-slate-400">Gun Model:</span> <span className="font-semibold text-slate-200">{meta.gunName}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Serial #:</span> <span className="font-mono text-slate-200">{meta.gunSerial}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Caliber:</span> <span className="font-semibold text-emerald-400">{meta.caliber}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Muzzle Velocity:</span> <span className="font-mono text-slate-200">{meta.muzzleVelocity} {meta.velocityUnit}</span></div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold mb-3">Range & Setup</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-slate-400">Field/Range:</span> <span className="font-semibold text-slate-200">{meta.fieldName}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Supervisor:</span> <span className="text-slate-200">{meta.supervisor}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Distance:</span> <span className="font-mono text-slate-200">{meta.distance} {meta.distanceUnit}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Target Type:</span> <span className="text-slate-200">{meta.targetType} ({meta.targetWidth}x{meta.targetHeight} {meta.dimensionUnit})</span></div>
            {meta.isMovingTarget && (
              <div className="pt-2 border-t border-slate-800 text-emerald-400">
                Moving Target: {meta.movingStartDist}m → {meta.movingImpactDist}m @ {meta.movingSpeed} km/h
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold mb-3">Overall Composite Metrics</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-slate-400">Group Size (MOA):</span> <strong className="text-emerald-400">{stats.moa} MOA</strong></div>
            <div className="flex justify-between"><span className="text-slate-400">Extreme Spread:</span> <span>{stats.esPhysical} {meta.dimensionUnit}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Total Rounds Fired:</span> <span className="font-mono text-emerald-400">{session.totalRoundsFired} Shots</span></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Round-by-Round Visual Telemetry
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {session.rounds.map((rd, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-emerald-400">ROUND #{rd.roundNumber}</span>
                <span className="text-[10px] text-slate-400">{rd.timestamp}</span>
              </div>

              <div className="relative border border-slate-800 rounded-lg overflow-hidden bg-slate-900 flex justify-center">
                <img src={rd.photoUrl} alt={`Round ${rd.roundNumber}`} className="w-full h-48 object-contain" />
                {rd.hits.map((h, hIdx) => (
                  <div
                    key={h.id || hIdx}
                    style={{ left: `${h.x}%`, top: `${h.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500/40 border border-emerald-400 flex items-center justify-center text-[8px] text-white font-mono font-bold"
                  >
                    {hIdx + 1}
                  </div>
                ))}
              </div>

              <div className="font-mono text-[11px] text-slate-300 space-y-1 pt-1">
                <div className="flex justify-between"><span>Group Size:</span> <strong className="text-emerald-400">{rd.stats.moa} MOA</strong></div>
                <div className="flex justify-between"><span>Spread:</span> <span>{rd.stats.esPhysical} {meta.dimensionUnit}</span></div>
                <div className="text-[10px] text-emerald-400 pt-1 border-t border-slate-900">{rd.stats.recommendation}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
