import React, { useState, useEffect, useRef, useCallback } from 'react';
import { requestForToken, onMessageListener } from './firebase';
import axios from 'axios';


const API_BASE = import.meta.env.VITE_API_BASE || 
    (() => {
        const host = window.location.hostname;
        // Local dev
        if (host === 'localhost' || host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
            return `http://${host}:5000/api`;
        }
        // Production - try current origin first (for Render full-stack), then fallback to specific URL
        if (host.includes('onrender.com')) {
          return `${window.location.origin}/api`;
        }
        return "https://ic-project.onrender.com/api";
    })();

const SERVER_BASE = API_BASE.replace('/api', '');

// --- Authentication Component ---
const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
            if (res.data.success) {
                onLogin(res.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f3faff] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-outline-variant/10">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl text-primary">domain</span>
                    </div>
                    <h1 className="text-3xl font-black text-[#001e42] tracking-tighter uppercase">Icon Tower</h1>
                    <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Data Records Management</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#43474f] ml-1">Username</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full h-14 bg-[#f3faff] border-0 rounded-2xl px-5 font-bold text-[#001e42] focus:ring-2 focus:ring-primary/20 transition-all"
                            placeholder="e.g. kartik"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#43474f] ml-1">Secret Key</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full h-14 bg-[#f3faff] border-0 rounded-2xl px-5 font-bold text-[#001e42] focus:ring-2 focus:ring-primary/20 transition-all pr-12"
                                placeholder="••••••••"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c3c6d1] hover:text-[#001e42] transition-colors material-symbols-outlined select-none"
                            >
                                {showPassword ? 'visibility_off' : 'visibility'}
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">{error}</p>}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Access Records'}
                    </button>
                </form>
                
                <div className="mt-8 text-center">
                    <p className="text-[9px] text-[#c3c6d1] font-medium uppercase tracking-widest">Authorized Personnel Only</p>
                </div>
            </div>
        </div>
    );
};

// --- Shared Components ---
const TopNav = ({ current, setPage, user, onLogout }) => (
  <nav className="fixed top-0 w-full z-[100] bg-[#f3faff]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-6 py-2 md:py-3 shadow-[0px_20px_40px_rgba(7,30,39,0.06)]">
    <div className="flex items-center gap-2 md:gap-4">
      <div className="w-6 h-6 md:w-8 md:h-8 bg-primary rounded-lg flex items-center justify-center">
        <span className="material-symbols-outlined text-white text-base md:text-lg">domain</span>
      </div>
      <span className="text-sm md:text-xl font-black tracking-tighter text-[#001e42] leading-tight">Icon Tower Records</span>
    </div>
    <div className="flex items-center gap-3 md:gap-6">
      <div className="hidden md:flex items-center gap-8 text-[#43474f] font-medium text-sm">
        <button onClick={() => setPage('dashboard')} className={`${current === 'dashboard' ? 'text-[#001e42] border-b-2 border-[#001e42]' : 'text-[#43474f] hover:text-[#001e42]'} pb-1 transition-all`}>Dashboard</button>
        <button onClick={() => setPage('scan')} className={`${current === 'scan' ? 'text-[#001e42] border-b-2 border-[#001e42]' : 'text-[#43474f] hover:text-[#001e42]'} pb-1 transition-all`}>Scan</button>
        <button onClick={() => setPage('history')} className={`${current === 'history' ? 'text-[#001e42] border-b-2 border-[#001e42]' : 'text-[#43474f] hover:text-[#001e42]'} pb-1 transition-all`}>History</button>
        <button onClick={() => setPage('tasks')} className={`${current === 'tasks' ? 'text-[#001e42] border-b-2 border-[#001e42]' : 'text-[#43474f] hover:text-[#001e42]'} pb-1 transition-all`}>Tasks</button>
        <button onClick={() => setPage('checklist')} className={`${current === 'checklist' ? 'text-[#001e42] border-b-2 border-[#001e42]' : 'text-[#43474f] hover:text-[#001e42]'} pb-1 transition-all`}>Checklist</button>
        <button onClick={() => setPage('expenses')} className={`${current === 'expenses' ? 'text-[#001e42] border-b-2 border-[#001e42]' : 'text-[#43474f] hover:text-[#001e42]'} pb-1 transition-all`}>Expenses</button>
      </div>
      <div className="flex items-center gap-2 mr-1">
        <div className="flex flex-col items-end">
            <span className="text-[8px] md:text-[10px] font-black text-[#001e42] uppercase tracking-widest leading-none">{user.name.split(' ')[0]}</span>
            <span className="text-[7px] md:text-[9px] text-primary font-bold uppercase tracking-widest">{user.role}</span>
        </div>
        <button onClick={onLogout} className="material-symbols-outlined text-[#001e42] text-lg md:text-xl cursor-pointer hover:text-red-500 transition-colors">logout</button>
      </div>
    </div>
  </nav>
);

const SideNav = ({ current, setPage, user }) => (
  <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-[#e6f6ff] flex-col p-4 gap-2 pt-20 z-40 border-r border-outline-variant/10">
    <div className="mb-8 px-2">
      <div className="flex items-center gap-3 mb-6 bg-white p-3 rounded-xl shadow-sm">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-white">person</span>
        </div>
        <div>
          <p className="font-bold text-[#001e42] text-[11px] uppercase tracking-widest leading-tight">{user.name}</p>
          <p className="text-[10px] text-on-surface-variant font-medium">{user.role}</p>
        </div>
      </div>
    </div>
    <nav className="flex flex-col gap-1">
      <button onClick={() => setPage('dashboard')} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'dashboard' ? 'bg-white text-[#001e42] shadow-sm' : 'text-[#43474f] hover:translate-x-1'}`}>
        <span className="material-symbols-outlined" style={{fontVariationSettings: current === 'dashboard' ? "'FILL' 1" : ""}}>dashboard</span>
        <span className="uppercase tracking-widest text-[11px] font-bold">Dashboard</span>
      </button>
      <button onClick={() => setPage('scan')} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'scan' ? 'bg-white text-[#001e42] shadow-sm' : 'text-[#43474f] hover:translate-x-1'}`}>
        <span className="material-symbols-outlined" style={{fontVariationSettings: current === 'scan' ? "'FILL' 1" : ""}}>qr_code_scanner</span>
        <span className="uppercase tracking-widest text-[11px] font-bold">Scan</span>
      </button>
      <button onClick={() => setPage('history')} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'history' ? 'bg-white text-[#001e42] shadow-sm' : 'text-[#43474f] hover:translate-x-1'}`}>
        <span className="material-symbols-outlined" style={{fontVariationSettings: current === 'history' ? "'FILL' 1" : ""}}>history</span>
        <span className="uppercase tracking-widest text-[11px] font-bold">History</span>
      </button>
      <button onClick={() => setPage('tasks')} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'tasks' ? 'bg-white text-[#001e42] shadow-sm' : 'text-[#43474f] hover:translate-x-1'}`}>
        <span className="material-symbols-outlined" style={{fontVariationSettings: current === 'tasks' ? "'FILL' 1" : ""}}>assignment</span>
        <span className="uppercase tracking-widest text-[11px] font-bold">Tasks</span>
      </button>
      <button onClick={() => setPage('checklist')} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'checklist' ? 'bg-white text-[#001e42] shadow-sm' : 'text-[#43474f] hover:translate-x-1'}`}>
        <span className="material-symbols-outlined" style={{fontVariationSettings: current === 'checklist' ? "'FILL' 1" : ""}}>fact_check</span>
        <span className="uppercase tracking-widest text-[11px] font-bold">Checklist</span>
      </button>
      <button onClick={() => setPage('expenses')} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${current === 'expenses' ? 'bg-white text-[#001e42] shadow-sm' : 'text-[#43474f] hover:translate-x-1'}`}>
        <span className="material-symbols-outlined" style={{fontVariationSettings: current === 'expenses' ? "'FILL' 1" : ""}}>receipt_long</span>
        <span className="uppercase tracking-widest text-[11px] font-bold">Expenses</span>
      </button>
    </nav>
  </aside>
);

const BottomNav = ({ current, setPage }) => (
  <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg flex justify-around items-center px-4 pb-4 pt-2 shadow-[0px_-4px_12px_rgba(0,0,0,0.05)] border-t border-outline-variant/15 z-50 rounded-t-xl">
    <button onClick={() => setPage('dashboard')} className={`flex flex-col items-center justify-center ${current === 'dashboard' ? 'text-[#001e42]' : 'text-[#43474f]'}`}>
      <span className="material-symbols-outlined" style={{fontVariationSettings: current === 'dashboard' ? "'FILL' 1" : ""}}>dashboard</span>
      <span className="text-[10px] font-medium uppercase mt-1">Home</span>
    </button>
    <button onClick={() => setPage('scan')} className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${current === 'scan' ? 'bg-[#d6e3ff] text-[#001e42] scale-110' : 'text-[#43474f]'}`}>
      <span className="material-symbols-outlined" style={{fontVariationSettings: current === 'scan' ? "'FILL' 1" : ""}}>qr_code_scanner</span>
    </button>
    <button onClick={() => setPage('history')} className={`flex flex-col items-center justify-center ${current === 'history' ? 'text-[#001e42]' : 'text-[#43474f]'}`}>
      <span className="material-symbols-outlined" style={{fontVariationSettings: current === 'history' ? "'FILL' 1" : ""}}>history</span>
      <span className="text-[10px] font-medium uppercase mt-1">Archive</span>
    </button>
    <button onClick={() => setPage('tasks')} className={`flex flex-col items-center justify-center ${current === 'tasks' ? 'text-[#001e42]' : 'text-[#43474f]'}`}>
      <span className="material-symbols-outlined" style={{fontVariationSettings: current === 'tasks' ? "'FILL' 1" : ""}}>assignment_turned_in</span>
      <span className="text-[10px] font-medium uppercase mt-1">Tasks</span>
    </button>
    <button onClick={() => setPage('checklist')} className={`flex flex-col items-center justify-center ${current === 'checklist' ? 'text-[#001e42]' : 'text-[#43474f]'}`}>
      <span className="material-symbols-outlined" style={{fontVariationSettings: current === 'checklist' ? "'FILL' 1" : ""}}>fact_check</span>
      <span className="text-[10px] font-medium uppercase mt-1">Cleaning</span>
    </button>
    <button onClick={() => setPage('expenses')} className={`flex flex-col items-center justify-center ${current === 'expenses' ? 'text-[#001e42]' : 'text-[#43474f]'}`}>
      <span className="material-symbols-outlined" style={{fontVariationSettings: current === 'expenses' ? "'FILL' 1" : ""}}>receipt_long</span>
      <span className="text-[10px] font-medium uppercase mt-1">Bills</span>
    </button>
  </nav>
);


// --- View Components ---

const Calendar = ({ logs, onDateSelect, selectedDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

    const totalDays = daysInMonth(month, year);
    const offset = firstDayOfMonth(month, year);
    const days = [];

    for (let i = 0; i < offset; i++) {
        days.push(<div key={`empty-${i}`} className="h-10 md:h-14"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayLogs = logs.filter(l => l.date === dateStr);
        const log = dayLogs.length > 0 ? dayLogs[0] : null;
        const isToday = new Date().toISOString().split('T')[0] === dateStr;
        const isSelected = selectedDate === dateStr;

        days.push(
            <div 
                key={d} 
                onClick={() => onDateSelect(dateStr)}
                className={`h-10 md:h-14 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all relative group
                    ${isSelected ? 'bg-[#001e42] text-white shadow-lg scale-105 z-10' : 'hover:bg-[#001e42]/5'}
                    ${isToday && !isSelected ? 'border-2 border-[#001e42]/20' : ''}
                `}
            >
                <span className={`text-[10px] md:text-xs font-black ${isSelected ? 'text-white' : 'text-[#001e42]'}`}>{d}</span>
                {log && (
                    <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : (log.status === 'Completed' || log.status === 'SETTLED' ? 'bg-green-500' : (log.status === 'FINE' || log.status === 'HIGH' ? 'bg-red-500' : 'bg-orange-400'))}`}></div>
                )}
                {log && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#001e42] text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-xl border border-white/10">
                        {log.status}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/10 w-full animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-sm md:text-base uppercase tracking-widest text-[#001e42]">{monthNames[month]} {year}</h3>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <div key={`${day}-${idx}`} className="text-center text-[8px] md:text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40 py-2">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
                {days}
            </div>
        </div>
    );
};

const Dashboard = ({ setPage, lastUpdate }) => {
    const [stats, setStats] = useState({ totalViolations: 0, totalWarnings: 0, totalFines: 0, averageFine: 0, totalPaidAmount: 0, unpaidFines: 0 });
    const [history, setHistory] = useState([]);

    useEffect(() => {
        axios.get(`${API_BASE}/stats/dashboard`).then(res => setStats(res.data.stats));
        axios.get(`${API_BASE}/violations/history?limit=5`).then(res => setHistory(res.data.violations));
    }, [lastUpdate]);

    return (
        <div className="max-w-7xl mx-auto py-12 px-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-[#001e42] mb-8 uppercase">System Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="stat-card bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
                    <div className="flex justify-between items-start mb-4">
                        <span className="material-symbols-outlined text-primary bg-blue-50 p-2 rounded-lg">description</span>
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">+12%</span>
                    </div>
                    <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Total Violations</p>
                    <h2 className="text-3xl font-black text-primary mt-1">{stats.totalViolations}</h2>
                </div>
                <div className="stat-card bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
                    <div className="flex justify-between items-start mb-4">
                        <span className="material-symbols-outlined text-orange-500 bg-orange-50 p-2 rounded-lg">warning</span>
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Active</span>
                    </div>
                    <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Warnings Issued</p>
                    <h2 className="text-3xl font-black text-primary mt-1">{stats.totalWarnings}</h2>
                </div>
                <div className="stat-card bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
                    <div className="flex justify-between items-start mb-4">
                        <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-2 rounded-lg">account_balance_wallet</span>
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{stats.unpaidFines} Unpaid</span>
                    </div>
                    <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Fines Collected</p>
                    <h2 className="text-3xl font-black text-primary mt-1">{stats.totalFines}</h2>
                </div>
                <div className="stat-card bg-primary p-6 rounded-2xl shadow-lg text-white">
                    <div className="flex justify-between items-start mb-4">
                        <span className="material-symbols-outlined text-white bg-white/10 p-2 rounded-lg">payments</span>
                        <span className="material-symbols-outlined text-white/50 text-sm">trending_up</span>
                    </div>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Total Revenue</p>
                    <h2 className="text-3xl font-black mt-1">₹{stats.totalPaidAmount}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10">
                    <h3 className="font-black text-xl mb-6 uppercase tracking-tight">Recent Activity</h3>
                    <div className="space-y-4">
                        {history.map((v, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-surface-container/30 rounded-xl hover:bg-surface-container/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-xs uppercase">{v.vehicleNumber.slice(-2)}</div>
                                    <div>
                                        <p className="font-bold text-sm text-[#001e42]">{v.vehicleNumber}</p>
                                        <p className="text-[10px] text-on-surface-variant uppercase font-medium">{new Date(v.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${v.action === 'WARNING' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                                    {v.action}
                                </span>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setPage('history')} className="w-full text-center mt-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#001e42] hover:opacity-70 transition-opacity">View All History</button>
                </div>
                <div className="bg-[#e6f6ff] p-8 rounded-2xl flex flex-col">
                    <h3 className="font-black text-xl mb-6 uppercase tracking-tight text-[#001e42]">Quick Actions</h3>
                    <div className="grid gap-4">
                        <button onClick={() => setPage('scan')} className="flex items-center gap-4 bg-primary text-white p-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform text-left">
                            <span className="material-symbols-outlined bg-white/10 p-2 rounded-lg">qr_code_scanner</span>
                            <div>
                                <p className="font-bold text-sm">New Scan</p>
                                <p className="text-[10px] text-white/60 uppercase font-medium">Detect plate wirelessly</p>
                            </div>
                        </button>
                        <button onClick={() => setPage('checklist')} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-outline-variant/10 hover:bg-white/50 transition-colors text-primary text-left">
                            <span className="material-symbols-outlined bg-blue-50 p-2 rounded-lg text-primary">fact_check</span>
                            <div>
                                <p className="font-bold text-sm">Maintenance</p>
                                <p className="text-[10px] text-on-surface-variant uppercase font-medium">Daily Protocol Log</p>
                            </div>
                        </button>
                        <button onClick={() => setPage('expenses')} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-outline-variant/10 hover:bg-white/50 transition-colors text-primary text-left">
                            <span className="material-symbols-outlined bg-green-50 p-2 rounded-lg text-green-600">receipt_long</span>
                            <div>
                                <p className="font-bold text-sm">Finances</p>
                                <p className="text-[10px] text-on-surface-variant uppercase font-medium">Log Expenditure</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Scan = ({ onResult }) => {
    const [capturing, setCapturing] = useState(false);
    const [dbResult, setDbResult] = useState(null);
    const [manualPlate, setManualPlate] = useState('');
    const [scanCategory, setScanCategory] = useState('NO_PARKING');
    
    const categories = [
        { id: 'NO_PARKING', label: 'Unauthorized Parking' },
        { id: 'BLOCKED_ENTRANCE', label: 'Blocked Entrance' },
        { id: 'DOUBLE_PARKING', label: 'Double Parking' },
        { id: 'FIRE_HYDRANT', label: 'Fire Hydrant Obstruction' },
        { id: 'LOADING_ZONE', label: 'Commercial Loading Zone' },
        { id: 'DISABLED_SPACE', label: 'Disabled Bay Misuse' },
        { id: 'OVERNIGHT', label: 'Overnight Parking' },
        { id: 'OTHER', label: 'General Obstruction' },
    ];

    const handleManualCheck = async () => {
        if (!manualPlate) return;
        setCapturing(true);
        setDbResult(null);
        try {
            const checkRes = await axios.post(`${API_BASE}/violations/check`, { vehicleNumber: manualPlate.toUpperCase() });
            setDbResult(checkRes.data);
        } catch (err) {
            alert('Database check failed.');
        } finally {
            setCapturing(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 flex flex-col gap-8 px-4 pb-32">
            <header>
                <h1 className="text-3xl font-black tracking-tighter text-[#001e42]">MANUAL PLATE ENTRY</h1>
                <p className="text-on-surface-variant font-medium text-sm">Enter the vehicle number manually to check for violations.</p>
            </header>
            
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/10 flex flex-col gap-6">
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#43474f] ml-1">Reason for Entry</label>
                        <select 
                            value={scanCategory} 
                            onChange={e => setScanCategory(e.target.value)}
                            className="w-full h-14 bg-[#f3faff] border-0 rounded-2xl px-5 font-bold text-[#001e42] focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#43474f] ml-1">License Plate Number</label>
                        <input 
                            value={manualPlate} 
                            onChange={e => setManualPlate(e.target.value.toUpperCase())}
                            className="w-full bg-[#f3faff] h-20 rounded-2xl border-2 border-primary/10 px-8 font-black text-3xl text-center text-primary uppercase focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="MH12AB1234"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleManualCheck} 
                    disabled={capturing || !manualPlate}
                    className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                    {capturing ? 'Searching...' : 'Check Plate Archive'}
                </button>
            </section>

            {dbResult && (
                <div className="bg-[#001e42] p-8 rounded-3xl text-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Violation History</span>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${dbResult.action === 'FINE' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            <span className="material-symbols-outlined text-xs">{dbResult.action === 'FINE' ? 'report' : 'info'}</span>
                            {dbResult.action === 'FINE' ? 'Repeat Offender' : 'Clean / Warning'}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Liability Status</p>
                            <h2 className="text-4xl font-black tracking-tighter">{dbResult.action === 'FINE' ? `₹${dbResult.fineAmount}` : 'No Fine'}</h2>
                        </div>
                        <button 
                            onClick={() => onResult(manualPlate.toUpperCase(), scanCategory)} 
                            className="bg-white text-primary px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                        >
                            Proceed
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Records = ({ onAction, lastUpdate }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const today = new Date().toISOString().split('T')[0];
    const [filter, setFilter] = useState('All');
    const [viewMode, setViewMode] = useState('Table'); // 'Table' or 'Calendar'
    const [selectedDate, setSelectedDate] = useState(today);

    useEffect(() => {
        fetchRecords();
    }, [filter, lastUpdate]);

    const fetchRecords = () => {
        let url = `${API_BASE}/violations/history?limit=50`;
        if (filter === 'Warnings') url += '&action=WARNING';
        if (filter === 'Fines') url += '&action=FINE';
        if (filter === 'Unpaid') url += '&finePaid=false';

        axios.get(url).then(res => {
            setList(res.data.violations);
            setLoading(false);
        });
    };

    const deleteViolation = async (id) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this violation record?')) return;
        try {
            await axios.delete(`${API_BASE}/violations/${id}`);
            alert('Record deleted successfully');
            fetchRecords();
        } catch (err) {
            alert('Failed to delete record');
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4">
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                <div className="lg:col-span-2 bg-white p-10 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col justify-center">
                    <h1 className="text-5xl font-black text-[#001e42] tracking-tighter mb-2 uppercase">Violation Archives</h1>
                    <p className="text-on-surface-variant font-medium text-sm tracking-tight text-balance">Official repository for Guardian-01 unit traffic violations and settlements.</p>
                </div>
                <div className="bg-primary p-10 rounded-2xl text-white flex flex-col justify-between shadow-xl">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Fleet Summary</span>
                    <div>
                        <h4 className="text-4xl font-black">{list.length}</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Verified Logs</p>
                    </div>
                </div>
            </section>

            <div className="bg-[#e6f6ff] p-4 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {['All', 'Warnings', 'Fines', 'Unpaid'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ${filter === f ? 'bg-primary text-white shadow-lg' : 'bg-white text-[#43474f] hover:bg-white/80'}`}>{f}</button>
                    ))}
                    <div className="w-[1px] h-8 bg-black/5 mx-2 hidden md:block"></div>
                    <button onClick={() => setViewMode(viewMode === 'Table' ? 'Calendar' : 'Table')} className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all gap-2 flex items-center shrink-0 ${viewMode === 'Calendar' ? 'bg-[#001e42] text-white shadow-lg' : 'bg-white text-[#001e42] border border-[#001e42]/10 hover:bg-white/80'}`}>
                        <span className="material-symbols-outlined text-sm">{viewMode === 'Table' ? 'calendar_month' : 'list'}</span>
                        {viewMode === 'Table' ? 'Calendar View' : 'Table View'}
                    </button>
                </div>
                <div className="relative w-full md:w-80">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#c3c6d1]">search</span>
                    <input className="w-full bg-white border-0 rounded-xl py-3 pl-12 pr-4 text-xs font-black tracking-widest placeholder:text-[#c3c6d1]" placeholder="SEARCH VEHICLE NO..." type="text"/>
                </div>
            </div>

            {viewMode === 'Calendar' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Calendar 
                        logs={list.map(v => ({ date: v.createdAt.split('T')[0], status: v.finePaid ? 'SETTLED' : v.action }))} 
                        onDateSelect={(date) => {
                            setSelectedDate(date);
                            // Scroll to the selected date table or just keep it filtered
                        }} 
                        selectedDate={selectedDate}
                    />
                    
                    {selectedDate && (
                        <div className="bg-white rounded-3xl shadow-sm border border-outline-variant/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-6 border-b border-outline-variant/10 bg-[#f3faff]">
                                <h3 className="font-black text-[#001e42] uppercase tracking-widest text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">event_note</span>
                                    Incidents on {selectedDate}
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[#f3faff]">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#43474f]">Vehicle</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#43474f]">Severity</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#43474f]">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/10">
                                        {list.filter(v => v.createdAt.split('T')[0] === selectedDate).length === 0 ? (
                                            <tr><td colSpan="3" className="px-8 py-10 text-center text-xs font-bold uppercase tracking-widest opacity-40">No records</td></tr>
                                        ) : (
                                            list.filter(v => v.createdAt.split('T')[0] === selectedDate).map((v, i) => (
                                                <tr key={i} className="hover:bg-[#f3faff] transition-colors">
                                                    <td className="px-8 py-6 font-black text-[#001e42]">{v.vehicleNumber}</td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${v.action === 'WARNING' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                                                            {v.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`text-[9px] font-bold uppercase ${v.finePaid ? 'text-green-600' : 'text-red-600'}`}>{v.finePaid ? 'Settled' : 'Pending'}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#f3faff]">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#43474f]">Identity</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#43474f]">Link</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#43474f]">Severity</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#43474f]">Due</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#43474f]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                            {list.map((v, i) => (
                                <tr key={i} className="hover:bg-[#f3faff] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-[#001e42] tracking-tighter">{v.vehicleNumber}</span>
                                            <span className="text-[10px] text-on-surface-variant font-medium uppercase">{new Date(v.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#d6e3ff] flex items-center justify-center text-xs font-black text-primary uppercase">{v.ownerName.slice(0,2)}</div>
                                            <span className="text-sm font-semibold text-[#001e42]">{v.ownerName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${v.action === 'WARNING' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                                            {v.action}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-[#001e42]">₹{v.fineAmount}</span>
                                            <span className={`text-[9px] font-bold uppercase ${v.finePaid ? 'text-green-600' : 'text-red-600'}`}>{v.finePaid ? 'Settled' : 'Pending'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => onAction(v._id)} 
                                                title="View Receipt / Info"
                                                className="p-2 rounded-lg bg-[#e6f6ff] text-[#001e42] hover:bg-[#001e42] hover:text-white transition-all scale-100 active:scale-95 flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">info</span>
                                                <span className="text-[10px] font-black uppercase">Info</span>
                                            </button>
                                            <button 
                                                onClick={() => deleteViolation(v._id)} 
                                                title="Delete Record"
                                                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all scale-100 active:scale-95 flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                <span className="text-[10px] font-black uppercase">Delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            )}
        </div>
    );
};

const ViolationForm = ({ plate, id, defaultCategory, onDone }) => {
    const [form, setForm] = useState({ 
        ownerName: '', 
        mobileNumber: '', 
        officeNumber: '',
        violationType: defaultCategory || 'NO_PARKING'
    });
    const [receipt, setReceipt] = useState(null);
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [photo, setPhoto] = useState(null);

    const categories = [
        { id: 'NO_PARKING', label: 'Unauthorized Parking' },
        { id: 'BLOCKED_ENTRANCE', label: 'Blocked Entrance' },
        { id: 'DOUBLE_PARKING', label: 'Double Parking' },
        { id: 'FIRE_HYDRANT', label: 'Fire Hydrant Obstruction' },
        { id: 'LOADING_ZONE', label: 'Commercial Loading Zone' },
        { id: 'DISABLED_SPACE', label: 'Disabled Bay Misuse' },
        { id: 'OVERNIGHT', label: 'Overnight Parking' },
        { id: 'OTHER', label: 'General Obstruction' },
    ];

    useEffect(() => {
        if (id) {
            axios.get(`${API_BASE}/violations/${id}`).then(res => {
                setForm(res.data.violation);
                setReceipt(res.data.receipt);
            });
        } else if (plate) {
            axios.post(`${API_BASE}/violations/check`, { vehicleNumber: plate }).then(res => {
                setStatusData(res.data);
            });
        }
    }, [id, plate]);

    const handleSave = async () => {
        if (!form.ownerName || !form.mobileNumber) return alert('Enter owner details');
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('vehicleNumber', plate || form.vehicleNumber);
            Object.keys(form).forEach(key => formData.append(key, form[key]));
            if (photo) formData.append('photo', photo);

            const res = await axios.post(`${API_BASE}/violations/record`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setReceipt(res.data.receipt);
            alert('Record saved successfully.');
        } catch (err) {
            alert('Failed to record violation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 pb-32">
            <header className="mb-10">
                <button onClick={onDone} className="flex items-center gap-2 text-on-surface-variant hover:text-[#001e42] mb-2 transition-colors">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return To Desktop</span>
                </button>
                <h1 className="text-4xl font-black text-[#001e42] tracking-tighter uppercase">Violation Report</h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-[#001e42] p-10 rounded-2xl text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5 translate-x-1/4 -translate-y-1/4">
                            <span className="material-symbols-outlined text-[10rem]">directions_car</span>
                        </div>
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-2 block">Target Identification</span>
                        <h2 className="text-6xl font-black tracking-tighter mb-4">{plate || form.vehicleNumber}</h2>
                        <div className="flex items-center gap-2 bg-white/10 w-fit px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                            <span className="material-symbols-outlined text-sm text-[#001e42] bg-white rounded-full">verified</span>
                            Security Protocol Verified
                        </div>
                    </div>

                    {statusData?.action === 'FINE' && !receipt && (
                        <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-2xl flex items-start gap-4">
                            <span className="material-symbols-outlined text-red-600">report</span>
                            <div>
                                <h4 className="font-black text-red-700 text-sm uppercase tracking-widest">Enforcement Level: HIGH</h4>
                                <p className="text-red-600 text-sm font-medium">Auto-fine logic suggested: ₹{statusData.fineAmount}. Reason: Repeat Offender.</p>
                            </div>
                        </div>
                    )}

                    {!receipt && (
                        <div className="bg-[#f3faff] p-10 rounded-2xl border border-outline-variant/10 space-y-8 shadow-sm">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Owner Profile Name</label>
                                    <input value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})} className="w-full bg-white h-14 rounded-xl border-0 shadow-sm px-5 font-bold tracking-tight text-[#001e42]" placeholder="NAME AS PER RECORDS"/>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Unit / Block Number</label>
                                    <input value={form.officeNumber} onChange={e => setForm({...form, officeNumber: e.target.value})} className="w-full bg-white h-14 rounded-xl border-0 shadow-sm px-5 font-bold tracking-tight text-[#001e42]" placeholder="e.g. A-101"/>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Mobile Contact Link</label>
                                    <input value={form.mobileNumber} onChange={e => setForm({...form, mobileNumber: e.target.value})} className="w-full bg-white h-14 rounded-xl border-0 shadow-sm px-5 font-bold tracking-tight text-[#001e42]" placeholder="TELEPHONE ID"/>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Violation Category</label>
                                    <select 
                                        value={form.violationType} 
                                        onChange={e => setForm({...form, violationType: e.target.value})}
                                        className="w-full bg-white h-14 rounded-xl border-0 shadow-sm px-5 font-bold tracking-tight text-[#001e42] appearance-none"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Incident Proof Photo (Evidence)</label>
                                    <label className="w-full flex items-center justify-center gap-3 h-20 rounded-2xl border-2 border-dashed border-primary/20 bg-white hover:bg-primary/5 cursor-pointer transition-all">
                                        <span className="material-symbols-outlined text-primary text-3xl">photo_camera</span>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-[#001e42]">{photo ? 'Photo Captured' : 'Attach Violation Evidence'}</span>
                                            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-tight">{photo ? photo.name : 'Click to upload or take photo'}</span>
                                        </div>
                                        <input type="file" accept="image/*" className="hidden" capture="environment" onChange={(e) => setPhoto(e.target.files[0])} />
                                    </label>
                                    {photo && (
                                        <div className="mt-4 rounded-xl overflow-hidden border border-primary/10 shadow-lg aspect-video">
                                            <img src={URL.createObjectURL(photo)} alt="Evidence Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={handleSave} disabled={loading} className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] shadow-xl transition-all ${loading ? 'bg-gray-400' : 'bg-gradient-to-r from-[#001e42] to-[#003368] text-white hover:scale-[1.01] active:scale-95'}`}>
                                {loading ? 'Processing...' : 'Record Violation & Notify'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-5">
                    <div className="bg-white/60 backdrop-blur-xl border border-outline-variant/10 p-10 rounded-3xl shadow-2xl relative">
                        <h3 className="font-black text-2xl tracking-tighter text-[#001e42] mb-10 flex justify-between items-center">
                            Enforcement Receipt
                            {receipt && <span className="material-symbols-outlined text-green-600">verified</span>}
                        </h3>
                        
                        <div className={`space-y-8 flex flex-col ${!receipt ? 'opacity-20 select-none grayscale' : ''}`}>
                            <div className="flex justify-between border-b border-outline-variant/10 pb-6">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Receipt ID</p>
                                    <p className="font-mono text-xs font-bold text-[#001e42]">{receipt?.receiptNumber || 'RCP-PENDING'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Timestamp</p>
                                    <p className="text-xs font-bold text-[#001e42]">{receipt?.date || '-- -- ----'}</p>
                                </div>
                            </div>

                            <div className="bg-[#f3faff] p-6 rounded-2xl space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-on-surface-variant uppercase text-[10px] tracking-widest">Type</span>
                                    <span className="font-black text-[#001e42]">{receipt?.violationType || '---'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-on-surface-variant uppercase text-[10px] tracking-widest">Severity Amount</span>
                                    <span className="font-black text-[#001e42]">₹{receipt?.fineAmount || '0.00'}</span>
                                </div>
                                <div className="border-t border-outline-variant/20 pt-4 flex justify-between items-center">
                                    <span className="text-[11px] font-black text-[#001e42] uppercase tracking-widest">Total Liability</span>
                                    <span className="text-2xl font-black text-[#001e42]">₹{receipt?.fineAmount || '0.00'}</span>
                                </div>
                            </div>

                            <div className="relative py-4">
                                <div className="w-full border-t border-dashed border-outline-variant/30"></div>
                            </div>

                            <div className="flex flex-col items-center">
                                <img className="w-48 h-48 mb-6 saturate-0 opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiHyJLrsDsT3SvyhjA2DoQwBH1JYI0hqLUmUCEVPdzwt4HP8gstg0S_pHyPCh_LYNU_3gwAKpmrvar1VIR0WGz7Zi6TASPjJsyLS60JKHus7LZONfJ6CqmsSazV-M9iELEEmPG3KcaevZwCB2lI9apeSHDYqPIn4QIz0BnG4lVTkVhqBFMTSfPTNianfJshnGRbDyFCE93oPXlldHiKJlJhe2OrpfGHmkIkbw2uIi2fY_--qptI6oHyFRxoON0ZciCEGt6sdlN1jJf"/>
                                <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-[0.2em] text-center leading-loose">
                                    Official electronic notice. Settlements must be completed at the central gate office within 48 hours.
                                </p>
                            </div>
                        </div>

                        {!receipt && (
                            <div className="absolute inset-0 flex items-center justify-center p-10">
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-5xl text-blue-100 mb-4 animate-pulse">assignment_late</span>
                                    <p className="text-xs font-black text-[#c3c6d1] uppercase tracking-[0.3em]">Awaiting Data</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Tasks = ({ user, lastUpdate }) => {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [commentText, setCommentText] = useState({});
    const [loading, setLoading] = useState(false);

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`${API_BASE}/tasks`);
            setTasks(res.data.tasks);
        } catch (err) { console.error('Error fetching tasks', err); }
    };

    useEffect(() => { fetchTasks(); }, [lastUpdate]);

    const addTask = async (e) => {
        e.preventDefault();
        if (!title) return;
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/tasks`, { title, description: desc, createdBy: user.name });
            setTitle(''); setDesc('');
            fetchTasks();
        } finally { setLoading(false); }
    };

    const toggleStatus = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';
        await axios.patch(`${API_BASE}/tasks/${id}/status`, { status: nextStatus });
        fetchTasks();
    };

    const addComment = async (id) => {
        const text = commentText[id];
        if (!text) return;
        await axios.post(`${API_BASE}/tasks/${id}/comment`, { user: user.name, text });
        setCommentText({ ...commentText, [id]: '' });
        fetchTasks();
    };

    const deleteComment = async (taskId, commentId) => {
        if (!window.confirm('Delete this note?')) return;
        try {
            await axios.delete(`${API_BASE}/tasks/${taskId}/comment/${commentId}`);
            fetchTasks();
        } catch (err) { console.error('Error deleting comment', err); }
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await axios.delete(`${API_BASE}/tasks/${taskId}`);
            fetchTasks();
        } catch (err) { console.error('Error deleting task', err); }
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 pb-32">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-[#001e42] tracking-tighter uppercase">Tower Operations & Tasks</h1>
                <p className="text-on-surface-variant font-medium text-sm">Review, create, and collaborate on building maintenance and administrative tasks.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Task Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/60 md:sticky md:top-24">
                        <h3 className="font-bold text-lg md:text-xl mb-6 uppercase tracking-tight text-slate-900">New Task</h3>
                        <form onSubmit={addTask} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Task Title</label>
                                <input 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-slate-50 h-14 rounded-xl border border-slate-100 px-5 font-semibold text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all" 
                                    placeholder="e.g. Lobby AC Repair" 
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Description</label>
                                <textarea 
                                    value={desc} 
                                    onChange={e => setDesc(e.target.value)}
                                    className="w-full bg-slate-50 min-h-[100px] rounded-xl border border-slate-100 p-5 font-semibold text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all" 
                                    placeholder="Enter more details here..."
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-slate-800 active:scale-95 transition-all text-xs">
                                {loading ? 'Saving...' : 'Create Task'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Task List */}
                <div className="lg:col-span-2 space-y-4 md:space-y-8">
                    {tasks.length === 0 && (
                        <div className="bg-white p-20 rounded-3xl border border-dashed border-outline-variant/20 text-center">
                            <span className="material-symbols-outlined text-5xl md:text-6xl text-[#c3c6d1] mb-6">task_alt</span>
                            <p className="text-xs md:text-sm font-black text-[#c3c6d1] uppercase tracking-[0.3em]">No active tasks found</p>
                        </div>
                    )}
                    {tasks.map(task => (
                        <div key={task._id} className={`bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden transition-all ${task.status === 'Completed' ? 'opacity-75 grayscale-[0.3]' : 'hover:shadow-md'}`}>
                            <div className="p-5 md:p-8">
                                {/* Header Section */}
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${task.status === 'Completed' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></span>
                                            <h4 className={`text-base md:text-xl font-bold tracking-tight ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</h4>
                                        </div>
                                        <div className="flex items-center gap-3 ml-5">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{task.createdBy}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span className="text-[10px] text-slate-400 font-medium">{new Date(task.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button 
                                            onClick={() => toggleStatus(task._id, task.status)}
                                            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] transition-all shrink-0 border ${task.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'}`}
                                        >
                                            {task.status}
                                        </button>
                                        <button 
                                            onClick={() => deleteTask(task._id)}
                                            className="p-1.5 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all material-symbols-outlined text-lg"
                                        >
                                            delete
                                        </button>
                                    </div>
                                </div>

                                {/* Description Section */}
                                {task.description && task.description !== task.title && (
                                    <div className="ml-5 p-4 bg-slate-50 rounded-xl mb-6">
                                        <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">{task.description}</p>
                                    </div>
                                )}
                                
                                {/* Comments Section */}
                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">forum</span>
                                        <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Activity & Notes</label>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {task.comments.length === 0 && <p className="text-[10px] text-slate-300 font-medium italic py-2">No comments yet...</p>}
                                        {task.comments.map((c, i) => (
                                            <div key={i} className={`flex flex-col gap-1 max-w-[90%] group ${c.user === user.name ? 'ml-auto items-end' : 'items-start'}`}>
                                                <div className="flex items-center gap-2 px-1">
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase">{c.user}</span>
                                                    <span className="text-[8px] text-slate-300 font-medium">{new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                                <div className="relative">
                                                    <div className={`p-3 rounded-2xl text-xs md:text-sm font-semibold shadow-sm transition-all ${c.user === user.name ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'}`}>
                                                        {c.text}
                                                    </div>
                                                    {/* Delete feature on click (only for the author) */}
                                                    {c.user === user.name && (
                                                        <button 
                                                            onClick={() => deleteComment(task._id, c._id)}
                                                            className={`absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity active:scale-90`}
                                                        >
                                                            <span className="material-symbols-outlined text-xs">close</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Comment Input */}
                                    <div className="flex gap-2 mt-6">
                                        <input 
                                            value={commentText[task._id] || ''} 
                                            onChange={e => setCommentText({...commentText, [task._id]: e.target.value})}
                                            onKeyDown={e => e.key === 'Enter' && addComment(task._id)}
                                            className="flex-1 bg-slate-50 h-10 rounded-full border border-slate-200 px-4 focus:ring-2 focus:ring-primary/20 text-xs font-bold outline-none placeholder:text-slate-300" 
                                            placeholder="Write a note..." 
                                        />
                                        <button onClick={() => addComment(task._id)} className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-800 transition-all shadow-sm active:scale-90 shrink-0">
                                            <span className="material-symbols-outlined text-base">send</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Expenses = ({ user, lastUpdate }) => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    
    // Form state
    const [form, setForm] = useState({ title: '', amount: '', category: 'Miscellaneous', description: '', date: new Date().toISOString().split('T')[0] });
    const [photo, setPhoto] = useState(null);

    const categories = ['Electrical', 'Cleaning', 'Plumbing', 'Security', 'Maintenance', 'Water', 'Miscellaneous'];

    const fetchExpenses = async () => {
        try {
            const res = await axios.get(`${API_BASE}/expenses`);
            setExpenses(res.data.expenses);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchExpenses(); }, [lastUpdate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.amount) return alert('Enter title and amount');
        
        setLoading(true);
        const formData = new FormData();
        Object.keys(form).forEach(key => formData.append(key, form[key]));
        formData.append('createdBy', user.name);
        if (photo) formData.append('photo', photo);

        try {
            await axios.post(`${API_BASE}/expenses`, formData);
            setForm({ title: '', amount: '', category: 'Miscellaneous', description: '', date: new Date().toISOString().split('T')[0] });
            setPhoto(null);
            setShowForm(false);
            fetchExpenses();
        } catch (err) { alert('Failed to save expense'); } finally { setLoading(false); }
    };

    const deleteExpense = async (id) => {
        if (!window.confirm('Delete this record?')) return;
        await axios.delete(`${API_BASE}/expenses/${id}`);
        fetchExpenses();
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 pb-32">
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-[#001e42] tracking-tighter uppercase">Expense & Bills</h1>
                    <p className="text-on-surface-variant font-medium text-sm">Track building maintenance costs and vendor payments.</p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all ${showForm ? 'bg-red-500 text-white' : 'bg-[#001e42] text-white hover:scale-105 active:scale-95'}`}
                >
                    {showForm ? 'Cancel' : 'Add New Bill'}
                </button>
            </header>

            {showForm && (
                <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Expense Title</label>
                                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-50 h-14 rounded-xl px-5 font-semibold text-sm outline-none border border-slate-100" placeholder="e.g. Electric Motor Repair" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Amount (₹)</label>
                                    <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-slate-50 h-14 rounded-xl px-5 font-semibold text-sm outline-none border border-slate-100" placeholder="0.00" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-50 h-14 rounded-xl px-5 font-semibold text-sm outline-none border border-slate-100" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Category</label>
                                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-slate-50 h-14 rounded-xl px-5 font-semibold text-sm outline-none border border-slate-100 uppercase tracking-widest text-[10px]">
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Bill Description</label>
                                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-50 h-32 rounded-xl p-5 font-semibold text-sm outline-none border border-slate-100" placeholder="Notes about this expense..." />
                            </div>
                            <label className="flex items-center justify-center gap-3 h-14 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all">
                                <span className="material-symbols-outlined text-slate-400">upload_file</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{photo ? 'Photo Ready' : 'Upload Bill Photo'}</span>
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setPhoto(e.target.files[0])} />
                            </label>
                            <button type="submit" disabled={loading} className="w-full h-14 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all text-xs">
                                {loading ? 'Saving Record...' : 'Confirm & Save Bill'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expenses.length === 0 && <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100"><p className="text-slate-300 font-bold uppercase tracking-widest text-xs">No expense records found</p></div>}
                {expenses.map(exp => (
                    <div key={exp._id} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col group">
                        {exp.photoProof ? (
                            <div className="aspect-[4/3] bg-slate-100 relative group overflow-hidden">
                                <img src={exp.photoProof} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex justify-between items-end">
                                    <span className="bg-white/20 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded">₹{exp.amount}</span>
                                    <a href={exp.photoProof} target="_blank" className="material-symbols-outlined text-white/50 hover:text-white transition-colors cursor-pointer">zoom_in</a>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-200 text-5xl">receipt_long</span>
                            </div>
                        )}
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded mb-2 inline-block tracking-widest">{exp.category}</span>
                                    <h4 className="text-base font-bold text-slate-900 leading-tight">{exp.title}</h4>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{new Date(exp.date).toLocaleDateString()} — {exp.createdBy}</p>
                                </div>
                                <button onClick={() => deleteExpense(exp._id)} className="material-symbols-outlined text-slate-300 hover:text-red-500 transition-colors cursor-pointer">delete</button>
                            </div>
                            {exp.description && <p className="text-xs text-slate-500 font-medium leading-relaxed italic border-l-2 border-slate-100 pl-3">{exp.description}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ChecklistComponent = ({ user, lastUpdate }) => {
    const today = new Date().toISOString().split('T')[0];
    const [data, setData] = useState({ items: [], status: 'Pending', photoProof: null });
    const [templateTasks, setTemplateTasks] = useState([]);
    const [newTaskName, setNewTaskName] = useState('');
    const [auditList, setAuditList] = useState([]);
    const [photoFile, setPhotoFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [viewingHistory, setViewingHistory] = useState(false);
    const [showManage, setShowManage] = useState(false);
    const [selectedDate, setSelectedDate] = useState(today);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_BASE}/checklist/${today}`);
            if (res.data.checklist) {
                setData(res.data.checklist);
            } else {
                setData({ items: res.data.items, status: 'Pending', photoProof: null });
            }
        } catch (err) { console.error('Checklist fetch error', err); }
    };

    const fetchTemplate = async () => {
        try {
            const res = await axios.get(`${API_BASE}/checklist/template/all`);
            setTemplateTasks(res.data.tasks);
        } catch (err) { console.error('Template fetch error', err); }
    };

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_BASE}/checklist/history/all`);
            setAuditList(res.data.history);
        } catch (err) { console.error('History fetch error', err); }
    };

    useEffect(() => { 
        fetchData(); 
        fetchTemplate();
        fetchHistory(); 
    }, [lastUpdate]);

    const toggleItem = (index) => {
        // LOCK: Only the Caretaker (Ravindra) can tick/untick tasks.
        if (user.role !== 'Caretaker') return;
        
        // Prevent editing if already submitted as completed (optional, but safer)
        if (data.status === 'Completed') return;
        
        const newItems = [...data.items];
        newItems[index].isDone = !newItems[index].isDone;
        setData({ ...data, items: newItems });
    };


    const addTaskToTemplate = async () => {
        if (!newTaskName) return;
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/checklist/template/add`, { taskName: newTaskName });
            setNewTaskName('');
            fetchTemplate();
            fetchData(); // Update today's list if it's still new
        } catch (err) { alert('Already exists!'); } finally { setLoading(false); }
    };

    const removeTaskFromTemplate = async (id) => {
        setLoading(true);
        try {
            await axios.delete(`${API_BASE}/checklist/template/${id}`);
            fetchTemplate();
            fetchData();
        } finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('date', today);
        formData.append('items', JSON.stringify(data.items));
        formData.append('completedBy', user.name);
        formData.append('status', data.items.every(item => item.isDone) ? 'Completed' : 'Pending');
        if (photoFile) formData.append('photo', photoFile);

        try {
            await axios.post(`${API_BASE}/checklist`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Daily checklist submitted successfully!');
            fetchData();
            fetchHistory();
        } catch (err) { alert('Failed to save checklist'); } finally { setLoading(false); }
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 pb-32">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <h1 className="text-3xl md:text-4xl font-black text-[#001e42] tracking-tighter uppercase">Tower Maintenance Log</h1>
                   <p className="text-on-surface-variant font-medium text-xs md:text-sm">Daily cleaning and safety verification protocol.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setViewingHistory(!viewingHistory)}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewingHistory ? 'bg-primary text-white' : 'bg-[#e6f6ff] text-[#001e42]'}`}
                    >
                        {viewingHistory ? 'View Today' : 'Logs & History'}
                    </button>
                    {(user.role === 'Manager' || user.role === 'Chairman') && (
                        <button 
                            onClick={() => setShowManage(!showManage)}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${showManage ? 'bg-red-500 text-white' : 'bg-[#001e42] text-white'}`}
                        >
                            {showManage ? 'Close Manage' : 'Manage Tasks'}
                        </button>
                    )}
                </div>
            </header>

            {showManage && (
                <div className="bg-[#f3faff] p-8 rounded-3xl mb-8 border-2 border-dashed border-primary/20">
                     <h3 className="font-black text-xl mb-4 text-[#001e42] uppercase">Manage Daily Tasks (Template)</h3>
                     <div className="flex gap-4 mb-8">
                        <input 
                            value={newTaskName} 
                            onChange={e => setNewTaskName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTaskToTemplate()}
                            className="flex-1 bg-white h-14 rounded-xl border-0 shadow-sm px-5 font-bold" 
                            placeholder="Add new task (e.g. Check Lobby Glass)..." 
                        />
                        <button onClick={addTaskToTemplate} className="bg-primary text-white h-14 px-8 rounded-xl font-black uppercase tracking-widest">Add</button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templateTasks.map(t => (
                            <div key={t._id} className="bg-white p-4 rounded-xl flex justify-between items-center shadow-sm border border-outline-variant/10">
                                <span className="font-bold text-sm text-[#001e42]">{t.taskName}</span>
                                <button onClick={() => removeTaskFromTemplate(t._id)} className="material-symbols-outlined text-red-500 hover:scale-110 transition-all">delete</button>
                            </div>
                        ))}
                     </div>
                </div>
            )}

            {!viewingHistory ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Today's Checklist */}
                    <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-outline-variant/10">
                        <div className="flex justify-between items-center mb-8 border-b border-outline-variant/10 pb-4">
                            <div>
                                <h3 className="font-black text-xl md:text-2xl uppercase tracking-tight text-[#001e42]">Day: {today}</h3>
                                <span className={`text-[10px] md:text-[12px] font-black tracking-widest px-3 py-1 rounded inline-block mt-2 ${data.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {data.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">Progress</span>
                                <p className="text-2xl font-black text-[#001e42]">{data.items.filter(i => i.isDone).length}/{data.items.length}</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-10">
                            {data.items.map((item, i) => (
                                <div key={i} onClick={() => toggleItem(i)} className={`flex items-center gap-4 p-4 md:p-5 rounded-2xl border transition-all cursor-pointer ${item.isDone ? 'bg-green-50/50 border-green-200' : 'bg-[#f3faff] border-primary/5 hover:border-primary/20'}`}>
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${item.isDone ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-white border-2 border-primary/20'}`}>
                                        {item.isDone && <span className="material-symbols-outlined text-white text-sm">done</span>}
                                    </div>
                                    <span className={`text-sm md:text-base font-bold transition-all ${item.isDone ? 'text-green-800 line-through' : 'text-[#001e42]'}`}>
                                        {item.task}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Work Proof Photo</label>
                            <div className="flex flex-col gap-4">
                                {data.photoProof && (
                                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-outline-variant/10 shadow-lg mb-2">
                                        <img src={data.photoProof} className="w-full h-full object-cover" alt="Proof" />
                                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] text-white font-black uppercase">Verified Upload</div>
                                    </div>
                                )}
                                
                                {user.role === 'Caretaker' && (
                                    <label className="w-full flex items-center justify-center gap-3 h-16 rounded-2xl border-2 border-dashed border-primary/20 bg-[#f3faff] hover:bg-primary/5 cursor-pointer transition-all">
                                        <span className="material-symbols-outlined text-primary">add_a_photo</span>
                                        <span className="text-[11px] font-black uppercase tracking-widest text-primary">{photoFile ? 'Change Photo' : 'Upload Proof Photo'}</span>
                                        <input type="file" accept="image/*" className="hidden" capture="environment" onChange={(e) => setPhotoFile(e.target.files[0])} />
                                    </label>
                                )}
                                
                                {photoFile && <p className="text-[10px] text-green-600 font-black uppercase tracking-widest text-center">📸 Image Attached: {photoFile.name}</p>}
                                
                                {user.role === 'Caretaker' ? (
                                    <button 
                                      onClick={handleSubmit}
                                      disabled={loading}
                                      className="w-full h-18 py-5 bg-[#001e42] text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] active:scale-95 transition-all text-sm md:text-base disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : 'Submit Daily Record'}
                                    </button>
                                ) : (
                                    <div className="w-full py-4 px-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                                        <span className="material-symbols-outlined text-blue-500">info</span>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-blue-800 tracking-widest leading-none">Auditor Mode</span>
                                            <span className="text-[9px] font-bold text-blue-600">Only Ravindra Bhadur can submit records.</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#e6f6ff] p-8 md:p-12 rounded-3xl md:sticky md:top-24 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6">
                            <span className="material-symbols-outlined text-4xl text-primary" style={{fontVariationSettings: "'FILL' 1"}}>security</span>
                        </div>
                        <h4 className="text-xl md:text-2xl font-black text-[#001e42] mb-4 uppercase tracking-tight">Daily Maintenance Matrix</h4>
                        <div className="flex flex-wrap gap-2 justify-center mb-8">
                            {auditList.slice(0, 31).reverse().map((log, i) => (
                                <div key={i} title={`${log.date} - ${log.status}`} className={`w-6 h-6 rounded-md ${log.status === 'Completed' ? 'bg-green-500' : 'bg-orange-400'}`}></div>
                            ))}
                        </div>
                        <p className="text-sm md:text-base text-[#43474f] font-bold leading-relaxed mb-4">
                            Summary of last 30 days performance. Green indicates all checkpoints cleared.
                        </p>
                        <p className="text-[11px] font-black text-[#001e42] uppercase tracking-[0.2em]">Caretaker: {user.role === 'Caretaker' ? user.name : 'Ravindra Bhadur'}</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Calendar 
                        logs={auditList} 
                        onDateSelect={setSelectedDate} 
                        selectedDate={selectedDate} 
                    />

                    {selectedDate && (
                        <div className="bg-white rounded-3xl shadow-sm border border-outline-variant/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-6 border-b border-outline-variant/10 bg-[#f3faff]">
                                <h3 className="font-black text-[#001e42] uppercase tracking-widest text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">event_note</span>
                                    Log Details: {selectedDate}
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[#f3faff]">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#43474f]">Staff</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#43474f]">Checkpoints</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#43474f]">Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#43474f]">Proof</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/10">
                                        {auditList.filter(l => l.date === selectedDate).length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-8 py-12 text-center text-on-surface-variant font-bold uppercase text-[10px] tracking-widest opacity-40">No records found for this date</td>
                                            </tr>
                                        ) : (
                                            auditList.filter(l => l.date === selectedDate).map((log, i) => (
                                                <tr key={i} className="hover:bg-[#f3faff]/50 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#43474f] px-2 py-1 bg-surface-container rounded">{log.completedBy}</span>
                                                    </td>
                                                    <td className="px-8 py-6 font-bold text-sm text-[#001e42]">
                                                        {log.items.filter(it => it.isDone).length}/{log.items.length} Done
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${log.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {log.photoProof ? (
                                                            <a href={log.photoProof} target="_blank" className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
                                                                <span className="material-symbols-outlined text-sm">visibility</span>
                                                                View Image
                                                            </a>
                                                        ) : '--'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [selectedPlate, setSelectedPlate] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('NO_PARKING');
  const [notification, setNotification] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(0); // Trigger for real-time refresh


  useEffect(() => {
    if (user) {
        requestForToken(user.id, API_BASE);
        
        // Callback-based listener: catches ALL messages, not just the first
        onMessageListener((payload) => {
            console.log("🔔 Real-time notification received:", payload);
            setNotification(payload.notification);
            setLastUpdate(prev => prev + 1); // Trigger re-fetch in components
            setTimeout(() => setNotification(null), 5000); // Hide after 5s
            
            // Also show a system notification (Windows sidebar / phone tray)
            if (Notification.permission === 'granted') {
              try {
                new Notification(payload.notification?.title || 'Icon Tower', {
                  body: payload.notification?.body || 'New update',
                  icon: '/logo192.png',
                  tag: 'icon-tower-' + Date.now(),
                  requireInteraction: false,
                });
              } catch (e) {
                // Some browsers block Notification constructor, use SW instead
                navigator.serviceWorker?.ready?.then(reg => {
                  reg.showNotification(payload.notification?.title || 'Icon Tower', {
                    body: payload.notification?.body || 'New update',
                    icon: '/logo192.png',
                    tag: 'icon-tower-' + Date.now(),
                  });
                });
              }
            }
        });
    }
  }, [user]);

  // Polling fallback: refresh data every 30 seconds in case FCM doesn't work
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setLastUpdate(prev => prev + 1);
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Persist user session
  useEffect(() => {
    const savedUser = localStorage.getItem('icon_tower_user');
    if (savedUser) {
        setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('icon_tower_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('icon_tower_user');
    setPage('dashboard');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const startViolationProcess = (plate, category = 'NO_PARKING') => {
      setSelectedPlate(plate);
      setSelectedCategory(category);
      setSelectedId(null);
      setPage('violation');
  };

  const openReceipt = (id) => {
    setSelectedId(id);
    setSelectedPlate(null);
    setPage('violation');
  };

  return (
    <div className="min-h-screen bg-[#f3faff] font-sans selection:bg-primary/20 selection:text-primary">
      <TopNav current={page} setPage={setPage} user={user} onLogout={handleLogout} />
      <SideNav current={page} setPage={setPage} user={user} />
      
      <main className="md:pl-64 pt-16 min-h-screen">
        {page === 'dashboard' && <Dashboard setPage={setPage} lastUpdate={lastUpdate} />}
        {page === 'scan' && <Scan onResult={startViolationProcess} />}
        {page === 'history' && <Records onAction={openReceipt} lastUpdate={lastUpdate} />}
        {page === 'tasks' && <Tasks user={user} lastUpdate={lastUpdate} />}
        {page === 'checklist' && <ChecklistComponent user={user} lastUpdate={lastUpdate} />}
        {page === 'expenses' && <Expenses user={user} lastUpdate={lastUpdate} />}
        {page === 'violation' && <ViolationForm plate={selectedPlate} id={selectedId} defaultCategory={selectedCategory} onDone={() => setPage('history')} />}
      </main>

      <BottomNav current={page} setPage={setPage} />

      {/* Foreground Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-[1000] animate-in slide-in-from-right-full duration-500">
            <div className="bg-[#001e42] text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-start gap-4 max-w-sm">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">notifications_active</span>
                </div>
                <div>
                    <h4 className="font-bold text-sm tracking-tight">{notification.title}</h4>
                    <p className="text-xs text-[#c3c6d1] mt-1">{notification.body}</p>
                </div>
                <button onClick={() => setNotification(null)} className="material-symbols-outlined text-[#c3c6d1] text-lg">close</button>
            </div>
        </div>
      )}
    </div>
  );
}

export default App;
