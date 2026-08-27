import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Activity, ArrowUpRight, BarChart3, Bell, Check, ChevronRight, CircleUserRound,
  Gamepad2, Gauge, LogIn, LogOut, Menu, MessageCircle, Plus, RefreshCw, Send,
  ShieldCheck, Swords, Trophy, UserPlus, Users, X,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const nav = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'auth', label: 'Access', icon: ShieldCheck },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'scores', label: 'Scores', icon: BarChart3 },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'tournaments', label: 'Tournaments', icon: Swords },
];

async function request(path, options = {}) {
  const token = localStorage.getItem('pulse_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const text = await response.text();
  let body = text;
  try { body = text ? JSON.parse(text) : null; } catch {}
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('pulse_token');
      window.dispatchEvent(new Event('pulse:unauthorized'));
      throw new Error('Session expired or missing. Open Access and sign in again.');
    }
    throw new Error(body?.message || `Request failed (${response.status})`);
  }
  return body;
}

function unwrap(body) { return body?.data ?? body; }
function pretty(value) { return JSON.stringify(value, null, 2); }
function useApiAction() {
  const [state, setState] = useState({ loading: false, error: '', result: null });
  const run = async (fn) => {
    setState({ loading: true, error: '', result: null });
    try { setState({ loading: false, error: '', result: unwrap(await fn()) }); }
    catch (error) { setState({ loading: false, error: error.message, result: null }); }
  };
  return [state, run];
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>;
}
function ActionButton({ children, onClick, loading, tone = 'primary', type = 'button' }) {
  return <button type={type} className={`button ${tone}`} onClick={onClick} disabled={loading}>{loading ? <RefreshCw size={15} className="spin" /> : null}{children}</button>;
}
function Result({ state }) {
  if (state.loading) return <div className="result muted"><RefreshCw size={16} className="spin" /> Working...</div>;
  if (state.error) return <div className="result error"><X size={16} />{state.error}</div>;
  if (state.result !== null) return <pre className="result">{pretty(state.result)}</pre>;
  return null;
}
function Panel({ eyebrow, title, children, action }) {
  return <section className="panel"><div className="panel-head"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div>{action}</div>{children}</section>;
}

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', username: '', refreshToken: '' });
  const [state, run] = useApiAction();
  const set = (key) => (value) => setForm({ ...form, [key]: value });
  const submit = () => run(async () => {
    const body = mode === 'signup' ? form : mode === 'refresh' ? { refreshToken: form.refreshToken } : { email: form.email, password: form.password };
    const result = await request(`/auth/${mode === 'refresh' ? 'refreshToken' : mode}`, { method: 'POST', body: JSON.stringify(body) });
    const data = unwrap(result);
    if (data?.accessToken) { localStorage.setItem('pulse_token', data.accessToken); onLogin(data.accessToken); }
    return data;
  });
  return <Panel eyebrow="Identity layer" title="Control access">
    <div className="segmented"><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Create user</button><button className={mode === 'refresh' ? 'active' : ''} onClick={() => setMode('refresh')}>Refresh token</button></div>
    <div className="form-grid">{mode === 'signup' && <Field label="Username" value={form.username} onChange={set('username')} placeholder="arcade_hero" />}{mode !== 'refresh' && <Field label="Email" value={form.email} onChange={set('email')} type="email" placeholder="you@example.com" />} {mode !== 'refresh' && <Field label="Password" value={form.password} onChange={set('password')} type="password" placeholder="••••••••" />} {mode === 'refresh' && <Field label="Refresh token" value={form.refreshToken} onChange={set('refreshToken')} placeholder="Paste token" />}</div>
    <div className="actions"><ActionButton onClick={submit} loading={state.loading}>{mode === 'login' ? <><LogIn size={16} /> Sign in</> : mode === 'signup' ? <><UserPlus size={16} /> Create account</> : <><RefreshCw size={16} /> Refresh session</>}</ActionButton><ActionButton tone="ghost" onClick={() => run(() => request('/auth/protected'))}>Test protected route</ActionButton></div><Result state={state} />
  </Panel>;
}

function Overview({ loggedIn, refresh }) {
  const [state, run] = useApiAction();
  const [rank, setRank] = useState([]);
  const [game, setGame] = useState('');
  const [socketStatus, setSocketStatus] = useState('connecting');
  useEffect(() => { const socket = io(API); socket.on('connect', () => setSocketStatus('live')); socket.on('disconnect', () => setSocketStatus('offline')); return () => socket.disconnect(); }, []);
  const load = () => run(() => request('/leaderboard'));
  return <>
    <div className="hero"><div><div className="eyebrow bright">Live operations / 01</div><h1>Make every point<br /><em>count.</em></h1><p>One sharp console for the real-time leaderboard API. Seed games, move scores, and watch the board react.</p></div><div className="hero-mark"><Trophy size={42} /><span>PB<br />LIVE</span></div></div>
    <div className="stat-grid"><div className="stat"><span>API status</span><strong className="status"><i /> Connected</strong><small>{API}</small></div><div className="stat"><span>Socket stream</span><strong>{socketStatus === 'live' ? 'Live' : 'Waiting'}</strong><small>Realtime events</small></div><div className="stat"><span>Session</span><strong>{loggedIn ? 'Authenticated' : 'Guest mode'}</strong><small>{loggedIn ? 'Bearer token active' : 'Sign in to mutate data'}</small></div></div>
    <div className="content-grid"><Panel eyebrow="Fast lane" title="Leaderboard snapshot" action={<ActionButton tone="icon" onClick={load}><RefreshCw size={16} /></ActionButton>}><div className="inline-form"><Field label="Game name" value={game} onChange={setGame} placeholder="Neon Sprint" /><ActionButton onClick={() => run(() => request(`/leaderboard/game?gameName=${encodeURIComponent(game)}`))} loading={state.loading}>Fetch board <ArrowUpRight size={15} /></ActionButton></div><Result state={state} /></Panel><Panel eyebrow="Live guide" title="Your next move"><div className="steps"><div><b>01</b><span>Sign in or create a player identity.</span></div><div><b>02</b><span>Create a game, then submit a score.</span></div><div><b>03</b><span>Open this board and watch the rank update.</span></div></div><button className="text-link" onClick={refresh}>Refresh dashboard <ChevronRight size={15} /></button></Panel></div>
  </>;
}

function Games() {
  const [form, setForm] = useState({ name: '', description: '', id: '' }); const [state, run] = useApiAction(); const set = (k) => (v) => setForm({ ...form, [k]: v });
  return <div className="content-grid"><Panel eyebrow="Game registry" title="Create a game"><div className="form-grid"><Field label="Name" value={form.name} onChange={set('name')} placeholder="Neon Sprint" /><Field label="Description" value={form.description} onChange={set('description')} placeholder="Velocity under pressure" /></div><div className="actions"><ActionButton onClick={() => run(() => request('/game', { method: 'POST', body: JSON.stringify({ name: form.name, description: form.description }) }))}> <Plus size={16} /> Create game</ActionButton><ActionButton tone="ghost" onClick={() => run(() => request('/game'))}>List games</ActionButton></div><Result state={state} /></Panel><Panel eyebrow="Game lookup" title="Inspect or delete"><Field label="Game ID or name" value={form.id} onChange={set('id')} placeholder="1 or Neon Sprint" /><div className="actions"><ActionButton tone="ghost" onClick={() => run(() => request(`/game/${form.id}`))}>Get by ID</ActionButton><ActionButton tone="ghost" onClick={() => run(() => request(`/game?name=${encodeURIComponent(form.id)}`))}>Find by name</ActionButton><ActionButton tone="danger" onClick={() => run(() => request(`/game/${form.id}`, { method: 'DELETE' }))}>Delete</ActionButton></div><Result state={state} /></Panel></div>;
}

function Scores() {
  const [form, setForm] = useState({ gameName: '', score: '', gameId: '', startDate: '', endDate: '', limit: '10' }); const [state, run] = useApiAction(); const set = (k) => (v) => setForm({ ...form, [k]: v });
  return <><div className="content-grid"><Panel eyebrow="Score engine" title="Submit a score"><div className="form-grid"><Field label="Game name" value={form.gameName} onChange={set('gameName')} placeholder="Neon Sprint" /><Field label="Points" value={form.score} onChange={set('score')} type="number" placeholder="4200" /></div><div className="actions"><ActionButton onClick={() => run(() => request(`/score?gameName=${encodeURIComponent(form.gameName)}`, { method: 'POST', body: JSON.stringify({ score: Number(form.score) }) }))}><Send size={16} /> Submit score</ActionButton><ActionButton tone="ghost" onClick={() => run(() => request(`/score?gameName=${encodeURIComponent(form.gameName)}`))}>Get high scores</ActionButton></div><Result state={state} /></Panel><Panel eyebrow="Reporting" title="Top players report"><div className="form-grid three"><Field label="Game ID" value={form.gameId} onChange={set('gameId')} placeholder="1" /><Field label="From" value={form.startDate} onChange={set('startDate')} type="date" /><Field label="To" value={form.endDate} onChange={set('endDate')} type="date" /></div><div className="actions"><ActionButton onClick={() => run(() => request(`/score/top-players?gameId=${form.gameId}&startDate=${form.startDate}&endDate=${form.endDate}&limit=${form.limit}`))}><BarChart3 size={16} /> Generate report</ActionButton></div><Result state={state} /></Panel></div></>;
}

function Social() {
  const [form, setForm] = useState({ userId: '', friendId: '', content: '' }); const [state, run] = useApiAction(); const set = (k) => (v) => setForm({ ...form, [k]: v });
  return <div className="content-grid"><Panel eyebrow="Player network" title="Friends"><div className="form-grid"><Field label="Receiver ID" value={form.friendId} onChange={set('friendId')} placeholder="2" /></div><div className="actions"><ActionButton onClick={() => run(() => request('/user/friends/request', { method: 'POST', body: JSON.stringify({ receiverId: Number(form.friendId) }) }))}><UserPlus size={16} /> Send request</ActionButton><ActionButton tone="ghost" onClick={() => run(() => request('/user/friends'))}>List friends</ActionButton><ActionButton tone="ghost" onClick={() => run(() => request('/user/friends/requests/pending'))}>Pending requests</ActionButton></div><Result state={state} /></Panel><Panel eyebrow="Direct line" title="Messages"><div className="form-grid"><Field label="Friend ID" value={form.userId} onChange={set('userId')} placeholder="2" /><Field label="Message" value={form.content} onChange={set('content')} placeholder="Nice run." /></div><div className="actions"><ActionButton onClick={() => run(() => request('/user/messages', { method: 'POST', body: JSON.stringify({ receiverId: Number(form.userId), content: form.content }) }))}><MessageCircle size={16} /> Send message</ActionButton><ActionButton tone="ghost" onClick={() => run(() => request(`/user/messages/${form.userId}`))}>Load thread</ActionButton><ActionButton tone="ghost" onClick={() => run(() => request('/user/messages/unread/count'))}><Bell size={16} /> Unread count</ActionButton></div><Result state={state} /></Panel></div>;
}

function Tournaments() {
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', maxParticipants: '20', gameIds: '', id: '', userId: '' }); const [state, run] = useApiAction(); const set = (k) => (v) => setForm({ ...form, [k]: v });
  return <div className="content-grid"><Panel eyebrow="Competitive events" title="Create tournament"><div className="form-grid"><Field label="Name" value={form.name} onChange={set('name')} placeholder="Friday Night Finals" /><Field label="Max players" value={form.maxParticipants} onChange={set('maxParticipants')} type="number" placeholder="20" /><Field label="Start" value={form.startDate} onChange={set('startDate')} type="datetime-local" /><Field label="End" value={form.endDate} onChange={set('endDate')} type="datetime-local" /><Field label="Game IDs" value={form.gameIds} onChange={set('gameIds')} placeholder="1, 2" /></div><div className="actions"><ActionButton onClick={() => run(() => request('/tournament', { method: 'POST', body: JSON.stringify({ name: form.name, startDate: form.startDate, endDate: form.endDate, maxParticipants: Number(form.maxParticipants), gameIds: form.gameIds.split(',').map(Number).filter(Boolean) }) }))}><Plus size={16} /> Create tournament</ActionButton><ActionButton tone="ghost" onClick={() => run(() => request('/tournament'))}>List tournaments</ActionButton></div><Result state={state} /></Panel><Panel eyebrow="Event controls" title="Join a tournament"><div className="form-grid"><Field label="Tournament ID" value={form.id} onChange={set('id')} placeholder="1" /><Field label="User ID" value={form.userId} onChange={set('userId')} placeholder="2" /></div><div className="actions"><ActionButton onClick={() => run(() => request(`/tournament/${form.id}/join`, { method: 'POST', body: JSON.stringify({ userId: Number(form.userId) }) }))}><Swords size={16} /> Join event</ActionButton><ActionButton tone="ghost" onClick={() => run(() => request(`/tournament/${form.id}`))}>Inspect event</ActionButton></div><Result state={state} /></Panel></div>;
}

export default function App() {
  const [view, setView] = useState('overview'); const [token, setToken] = useState(localStorage.getItem('pulse_token')); const [mobileOpen, setMobileOpen] = useState(false); const [tick, setTick] = useState(0);
  const loggedIn = Boolean(token); const current = nav.find((item) => item.id === view);
  const logout = () => { localStorage.removeItem('pulse_token'); setToken(null); };
  useEffect(() => {
    const handleUnauthorized = () => { setToken(null); };
    window.addEventListener('pulse:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('pulse:unauthorized', handleUnauthorized);
  }, []);
  useEffect(() => { if (token) request('/auth/protected').catch(() => {}); }, [token]);
  const content = useMemo(() => { if (view === 'overview') return <Overview loggedIn={loggedIn} refresh={() => setTick(tick + 1)} />; if (view === 'auth') return <Auth onLogin={setToken} />; if (view === 'games') return <Games />; if (view === 'scores') return <Scores />; if (view === 'social') return <Social />; return <Tournaments />; }, [view, loggedIn, tick]);
  return <div className="app-shell"><aside className={mobileOpen ? 'sidebar open' : 'sidebar'}><div className="brand"><div className="brand-icon"><Activity size={18} /></div><span>pulseboard<small>control room</small></span></div><nav>{nav.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'selected' : ''} onClick={() => { setView(id); setMobileOpen(false); }}><Icon size={17} /><span>{label}</span>{view === id ? <ChevronRight size={14} /> : null}</button>)}</nav><div className="sidebar-foot"><div className="connection"><i /> <span>API online<small>localhost:3000</small></span></div><button className="user-chip" onClick={loggedIn ? logout : () => setView('auth')}><CircleUserRound size={17} /><span>{loggedIn ? 'Sign out' : 'Guest session'}</span><LogOut size={14} /></button></div></aside><main className="main"><header><button className="menu" onClick={() => setMobileOpen(!mobileOpen)}><Menu size={20} /></button><div><div className="breadcrumb">Workspace <ChevronRight size={13} /> {current.label}</div><h3>{current.label}</h3></div><div className="header-actions"><span className="live-pill"><i /> live</span><button className="icon-button" title="Notifications"><Bell size={17} /></button><button className="avatar" onClick={() => setView('auth')}>PB</button></div></header><div className="page">{content}</div><footer><span>Pulseboard API console</span><span>Socket.IO stream <b>●</b></span></footer></main></div>;
}
