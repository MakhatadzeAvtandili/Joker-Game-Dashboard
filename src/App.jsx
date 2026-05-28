import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EXACT_MAP = {
  1: 100,
  2: 150,
  3: 200,
  4: 250,
  5: 300,
  6: 350,
  7: 400,
  8: 450,
  9: 900,
};
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const uid = () => Math.random().toString(36).slice(2);
const cn = (...xs) => xs.filter(Boolean).join(" ");
const fmt = (v) => (v / 100).toFixed(1);
const scoreColor = (v) => v > 0 ? "score-pos" : v < 0 ? "score-neg" : "score-zero";

const LS_USER = "joker_user";
const LS_GAMES = "joker_games";

const loadUser = () => {
  try {
    const r = localStorage.getItem(LS_USER);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
};
const saveUser = (u) => localStorage.setItem(LS_USER, JSON.stringify(u));
const loadGames = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_GAMES) || "[]");
  } catch {
    return [];
  }
};
const saveGames = (g) => localStorage.setItem(LS_GAMES, JSON.stringify(g));

function sequenceSetSizes() {
  return [8, 4, 8, 4];
}
function ninesSetSizes(handsPerSet = 4, totalSets = 4) {
  return Array.from({ length: totalSets }, () => handsPerSet);
}
function sequenceHandNumber(index) {
  const seq = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9, 8, 7, 6, 5, 4, 3, 2, 1, 9, 9, 9, 9,
  ];
  return seq[index] ?? 9;
}
function baseScore(bid, took, whist, handIndex = null, config = null) {
  if (took == null) return 0;
  if (bid === "-") return took === 0 ? 50 : took * 10;
  if (bid == null) return took * 10;
  const b = Number(bid);
  if (took === b) {
    if (config?.mode === "sequence") return b * 100;
    return EXACT_MAP[b] ?? b * 100;
  }
  if (took === 0) return whist;
  return took * 10;
}

export default function App() {
  const [user, setUser] = useState(loadUser());
  const [games, setGames] = useState(loadGames());
  const [activeId, setActiveId] = useState(games[0]?.id || null);
  useEffect(() => {
    saveGames(games);
  }, [games]);
  if (!user)
    return (
      <Auth
        onDone={(u) => {
          setUser(u);
          saveUser(u);
        }}
      />
    );
  const active = games.find((g) => g.id === activeId) || null;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        user={user}
        games={games}
        setActiveId={setActiveId}
        onNew={() => {
          const g = createNewGame();
          setGames([g, ...games]);
          setActiveId(g.id);
        }}
        onRename={(id, name) =>
          setGames((gs) => gs.map((g) => (g.id === id ? { ...g, name } : g)))
        }
        onDelete={(id) => {
          setGames((gs) => gs.filter((g) => g.id !== id));
          if (activeId === id) setActiveId(null);
        }}
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-24">
        {!active ? (
          <EmptyState
            onCreate={() => {
              const g = createNewGame();
              setGames([g, ...games]);
              setActiveId(g.id);
            }}
          />
        ) : (
          <GameEditor
            game={active}
            onChange={(ng) =>
              setGames((gs) => gs.map((g) => (g.id === active.id ? ng : g)))
            }
          />
        )}
      </div>
    </div>
  );
}

function Header({ user, games, setActiveId, onNew, onRename, onDelete }) {
  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 border-b border-slate-200/80" style={{height:'var(--header-h)'}}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-full flex items-center gap-2">
        <div className="text-base font-bold tracking-tight flex items-center gap-1.5 text-slate-900">
          <span className="text-lg">🃏</span>
          <span className="hidden sm:inline">Joker Score</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="btn-primary" onClick={onNew}>
            <span className="hidden sm:inline">ახალი თამაში</span>
            <span className="sm:hidden">+ ახალი</span>
          </button>
          <GamesDropdown
            games={games}
            setActiveId={setActiveId}
            onRename={onRename}
            onDelete={onDelete}
          />
          <div className="btn-ghost text-sm hidden xs:flex items-center">{user.name}</div>
        </div>
      </div>
    </div>
  );
}

function GamesDropdown({ games, setActiveId, onRename, onDelete }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState("");
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="btn-ghost flex items-center gap-1.5">
        <span className="text-sm">სესიები</span>
        {games.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">{games.length}</span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl p-2 max-h-[75vh] overflow-auto z-50"
            style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.1)', boxShadow: '0 8px 40px rgba(15,23,42,0.12)' }}
          >
            {games.length === 0 ? (
              <div className="p-4 text-sm text-slate-400 text-center">შენახული თამაში არ არის</div>
            ) : (
              games.map((g) => (
                <div key={g.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  {editingId === g.id ? (
                    <input
                      autoFocus
                      className="inp flex-1 py-1"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={() => { onRename(g.id, tempName || g.name); setEditingId(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { onRename(g.id, tempName || g.name); setEditingId(null); } }}
                    />
                  ) : (
                    <button className="flex-1 text-left min-w-0" onClick={() => { setActiveId(g.id); setOpen(false); }}>
                      <div className="font-medium text-sm truncate text-slate-800">{g.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {g.config.mode === "sequence" ? "რიგითობით" : "ცხრიანები"}
                        {g.config.pairsEnabled ? " · წყვილები" : ""}
                      </div>
                    </button>
                  )}
                  <button className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors px-1.5 py-1 rounded-lg hover:bg-slate-100"
                    onClick={() => { setEditingId(g.id); setTempName(g.name); }}>
                    ✏️
                  </button>
                  <button className="text-[11px] text-rose-500 hover:text-rose-600 transition-colors px-1.5 py-1 rounded-lg hover:bg-rose-50"
                    onClick={() => onDelete(g.id)}>
                    🗑
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <div className="text-6xl mb-4">🃏</div>
        <h1 className="text-2xl font-bold tracking-tight">Joker Score</h1>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          ჯოკერის ქულების ავტომატური პლატფორმა — ორი რეჟიმი, წყვილები, პრემიები.
        </p>
        <button className="btn-primary mt-6 px-6 py-2.5 text-base" onClick={onCreate}>
          ახალი თამაშის დაწყება
        </button>
      </div>
    </div>
  );
}

function Auth({ onDone }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const can = name.trim().length > 1 && /@/.test(email);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🃏</div>
          <h1 className="text-2xl font-bold tracking-tight">Joker Score</h1>
          <p className="text-sm text-slate-400 mt-1">შედი და დაიწყე თამაში</p>
        </div>
        <div className="card space-y-4">
          <div>
            <div className="text-xs text-slate-500 mb-1.5 font-medium">სახელი</div>
            <input
              className="inp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="მაგ. ნიკა"
            />
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1.5 font-medium">Email</div>
            <input
              className="inp"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <button
            disabled={!can}
            onClick={() => onDone({ id: uid(), name, email })}
            className={cn(
              "w-full py-2.5 rounded-xl text-sm font-medium transition-all",
              can ? "btn-primary" : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            შესვლა
          </button>
          <p className="text-[11px] text-slate-400 text-center">
            ლოკალური დემო – მონაცემები ინახება ბრაუზერში.
          </p>
        </div>
      </div>
    </div>
  );
}

function createNewGame() {
  const config = {
    players: ["Player 1", "Player 2", "Player 3", "Player 4"],
    whistPenalty: -900,
    handsPerSet: 4,
    totalSets: 4,
    startDealerIndex: 0,
    mode: "9s",
    passLimitEnabled: false,
    passLimitPerPlayer: 4,
    pairsEnabled: false,
    teamPremiumMode: "both_add", // "both_add" | "opp_deduct"
  };
  const totalHands =
    config.mode === "sequence"
      ? sequenceSetSizes().reduce((a, b) => a + b, 0)
      : config.handsPerSet * config.totalSets;
  const state = {
    bids: Array.from({ length: totalHands }, () => [null, null, null, null]),
    tooks: Array.from({ length: totalHands }, () => [null, null, null, null]),
    notes: "",
  };
  return {
    id: uid(),
    name: `სესია – ${new Date().toLocaleString()}`,
    createdAt: Date.now(),
    config,
    state,
  };
}

function GameEditor({ game, onChange }) {
  const { config, state } = game;
  const [showFinale, setShowFinale] = useState(false);

  const setMode = (m) => {
    const sizes =
      m === "sequence"
        ? sequenceSetSizes()
        : ninesSetSizes(game.config.handsPerSet, game.config.totalSets);
    const totalHands = sizes.reduce((a, b) => a + b, 0);
    const clone = structuredClone(game);
    clone.config.mode = m;
    const cur = clone.state.bids.length;
    if (totalHands > cur) {
      const add = Array.from({ length: totalHands - cur }, () => [
        null,
        null,
        null,
        null,
      ]);
      clone.state.bids = [...clone.state.bids, ...add];
      clone.state.tooks = [...clone.state.tooks, ...add];
    } else if (totalHands < cur) {
      clone.state.bids = clone.state.bids.slice(0, totalHands);
      clone.state.tooks = clone.state.tooks.slice(0, totalHands);
    }
    onChange(clone);
  };

  const dealerOf = (h) => (config.startDealerIndex + h) % 4; // rotates each hand
  const derived = useMemo(() => computeDerived(game), [game]);

  useEffect(() => {
    const sizes =
      game.config.mode === "sequence"
        ? sequenceSetSizes()
        : ninesSetSizes(game.config.handsPerSet, game.config.totalSets);
    const totalHands = sizes.reduce((a, b) => a + b, 0);
    if (derived.handsDone === totalHands) setShowFinale(true);
  }, [derived, game]);

  const hasSets = derived.sets.length > 0;

  const ExportBtn = () => (
    hasSets ? (
      <button
        onClick={() => window.print()}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800"
      >
        <span>📄</span>
        <span>PDF Export</span>
      </button>
    ) : null
  );

  return (
    <div className="py-6">
      {/* Mobile sidebar — above table */}
      <div className="md:hidden space-y-4 mb-4">
        <LiveTotalsCard game={game} derived={derived} />
        <HistoryCard game={game} onChange={onChange} derived={derived} />
        <ExportBtn />
      </div>

      <div className="md:mr-[420px] space-y-4">
        <ConfigCard game={game} onChange={onChange} setMode={setMode} />
        <PlayTable
          game={game}
          onChange={onChange}
          derived={derived}
          dealerOf={dealerOf}
        />
      </div>

      {/* Desktop fixed sidebar */}
      <div className="hidden md:block">
        <div className="fixed right-4 top-[72px] w-[400px] z-30 space-y-4 max-h-[calc(100vh-80px)] overflow-y-auto pb-6">
          <LiveTotalsCard game={game} derived={derived} />
          <HistoryCard game={game} onChange={onChange} derived={derived} />
          <ExportBtn />
        </div>
      </div>

      {/* Hidden print report — visible only via window.print() */}
      <PrintReport game={game} derived={derived} />

      <AnimatePresence>
        {showFinale && (
          <FinaleOverlay
            pairsEnabled={config.pairsEnabled}
            derived={derived}
            players={config.players}
            onClose={() => setShowFinale(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfigCard({ game, onChange, setMode }) {
  const { config } = game;
  const [collapsed, setCollapsed] = useState(false);
  const sizes =
    config.mode === "sequence"
      ? sequenceSetSizes()
      : ninesSetSizes(config.handsPerSet, config.totalSets);
  const totalHands = sizes.reduce((a, b) => a + b, 0);
  const passUsed = (pi) =>
    game.state.bids.flat().filter((b, ix) => ix % 4 === pi && b === "-").length;
  return (
    <div className="card">
      <button
        className="w-full flex items-center justify-between mb-1"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">⚙️ პარამეტრები</span>
          <span className="badge">სულ {totalHands} ხელი{config.mode === "sequence" ? " (8+4+8+4)" : ""}</span>
        </div>
        <span className="text-slate-400 text-sm">{collapsed ? "▼" : "▲"}</span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 grid sm:grid-cols-2 gap-3">
              <Field label="რეჟიმი">
                <select className="sel" value={config.mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="9s">ცხრიანები</option>
                  <option value="sequence">რიგითობით</option>
                </select>
              </Field>

              {config.mode === "sequence" ? (
                <Field label="Whist ჯარიმა">
                  <div className="inp text-xs text-slate-400">ავტომატური: −(დარიგება×100)</div>
                </Field>
              ) : (
                <>
                  <Field label="Whist ჯარიმა">
                    <input type="number" className="inp" value={config.whistPenalty}
                      onChange={(e) => onChange({ ...game, config: { ...config, whistPenalty: Number(e.target.value) } })} />
                  </Field>
                  <Field label="ხელები სეტში">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" min={1} className="inp" value={config.handsPerSet}
                        onChange={(e) => {
                          const v = clamp(Number(e.target.value) || 4, 1, 50);
                          const clone = structuredClone(game);
                          clone.config.handsPerSet = v;
                          const s = ninesSetSizes(v, clone.config.totalSets);
                          const tot = s.reduce((a, b) => a + b, 0);
                          const cur = clone.state.bids.length;
                          if (tot > cur) { const add = Array.from({ length: tot - cur }, () => [null,null,null,null]); clone.state.bids = [...clone.state.bids, ...add]; clone.state.tooks = [...clone.state.tooks, ...add]; }
                          else if (tot < cur) { clone.state.bids = clone.state.bids.slice(0, tot); clone.state.tooks = clone.state.tooks.slice(0, tot); }
                          onChange(clone);
                        }} />
                      <input type="number" min={1} className="inp" value={config.totalSets}
                        onChange={(e) => {
                          const v = clamp(Number(e.target.value) || 4, 1, 50);
                          const clone = structuredClone(game);
                          clone.config.totalSets = v;
                          const s = ninesSetSizes(clone.config.handsPerSet, v);
                          const tot = s.reduce((a, b) => a + b, 0);
                          const cur = clone.state.bids.length;
                          if (tot > cur) { const add = Array.from({ length: tot - cur }, () => [null,null,null,null]); clone.state.bids = [...clone.state.bids, ...add]; clone.state.tooks = [...clone.state.tooks, ...add]; }
                          else if (tot < cur) { clone.state.bids = clone.state.bids.slice(0, tot); clone.state.tooks = clone.state.tooks.slice(0, tot); }
                          onChange(clone);
                        }} />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">ხელებები / სეტები</div>
                  </Field>
                </>
              )}

              <Field label="პასის ლიმიტი (4/მოთამაშე)">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input id="passlimit" type="checkbox" className="rounded" checked={config.passLimitEnabled}
                    onChange={(e) => onChange({ ...game, config: { ...config, passLimitEnabled: e.target.checked } })} />
                  <span className="text-sm">ჩართე</span>
                </label>
                {config.passLimitEnabled && (
                  <div className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    {game.config.players.map((p, i) => (
                      <span key={i} className="mr-2">{p}: <span className="text-slate-700 font-semibold">{Math.max(0, 4 - passUsed(i))}</span></span>
                    ))}
                  </div>
                )}
              </Field>

              <Field label="წყვილები (1&amp;3 vs 2&amp;4)">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input id="pairs" type="checkbox" className="rounded" checked={config.pairsEnabled}
                    onChange={(e) => onChange({ ...game, config: { ...config, pairsEnabled: e.target.checked } })} />
                  <span className="text-sm">ჩართე</span>
                </label>
                {config.pairsEnabled && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-2 flex-wrap text-[11px]">
                      <span className="badge badge-team-a">Team A: {config.players[0]} + {config.players[2]}</span>
                      <span className="badge badge-team-b">Team B: {config.players[1]} + {config.players[3]}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-relaxed">
                      1 ზუსტი → +პრემია + მოწინააღდეგე −maxBase · 2 ზუსტი → ორივეს +პრემია · ორივე გუნდი → ნეიტრალი
                    </div>
                  </div>
                )}
              </Field>

              <Field label="დამწყები დილერი">
                <select className="sel" value={config.startDealerIndex}
                  onChange={(e) => onChange({ ...game, config: { ...config, startDealerIndex: Number(e.target.value) } })}>
                  {config.players.map((p, i) => <option key={i} value={i}>{p}</option>)}
                </select>
              </Field>

              {config.players.map((p, i) => (
                <Field key={i} label={`მოთამაშე ${i + 1}`}>
                  <input className="inp" value={p}
                    onChange={(e) => onChange({ ...game, config: { ...config, players: config.players.map((x, ix) => ix === i ? e.target.value : x) } })} />
                </Field>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div>
      <div className="text-[11px] text-zinc-500 mb-1.5 font-medium uppercase tracking-wide">{label}</div>
      {children}
    </div>
  );
}

function PlayTable({ game, onChange, derived, dealerOf }) {
  const { config, state } = game;
  const totalHands = state.bids.length;
  const ccOf = (h) => (config.mode === "sequence" ? sequenceHandNumber(h) : 9);

  const setHandIdx = (h, pIndex, kind, val) => {
    const clone = structuredClone(game);
    clone.state[kind][h][pIndex] = val;
    onChange(clone);
  };

  const sumOthersTook = (h, me) => {
    const cc = ccOf(h);
    const s = state.tooks[h].reduce(
      (acc, v, ix) => acc + (ix === me || v == null ? 0 : Number(v)), 0
    );
    return Math.min(s, cc);
  };
  const remainingFor = (h, me) => {
    const rem = ccOf(h) - sumOthersTook(h, me);
    return rem < 0 ? 0 : rem;
  };
  const passUsedExcept = (playerIndex, handIndex) => {
    let used = 0;
    for (let h = 0; h < state.bids.length; h++)
      for (let p = 0; p < 4; p++)
        if (p === playerIndex && h !== handIndex && state.bids[h][p] === "-") used++;
    return used;
  };
  const nextEmpty = React.useMemo(() => {
    for (let h = 0; h < totalHands; h++) {
      if (state.bids[h].some((x) => x == null) || state.tooks[h].some((x) => x == null)) return h;
    }
    return totalHands - 1;
  }, [state, totalHands]);

  const posLabel = ["პირველი", "მეორე", "მესამე", "ბოლო"];

  const playerCellProps = (h, pIndex) => {
    const bids = state.bids[h];
    const tooks = state.tooks[h];
    const dealer = dealerOf(h);
    const cc = ccOf(h);
    const isDealer = pIndex === dealer;
    const cap = config.mode === "sequence" ? cc : 9;
    const delta = (pIndex - dealer + 4) % 4;
    const ordIdx = delta === 0 ? 3 : delta - 1;
    const othersSumBid = bids.reduce((acc, v, ix) => acc + (ix === pIndex || v == null || v === "-" ? 0 : Number(v)), 0);
    let mustNotPass = false, forbidExactFill = null;
    if (isDealer) {
      if (othersSumBid === cap) mustNotPass = true;
      else if (othersSumBid < cap) forbidExactFill = cap - othersSumBid;
    }
    const usedPasses = passUsedExcept(pIndex, h);
    const currentIsPass = bids[pIndex] === "-";
    const passDisabled = config.passLimitEnabled ? (!currentIsPass && Math.max(0, (config.passLimitPerPlayer || 4) - usedPasses) <= 0) : false;
    const bid = bids[pIndex];
    const took = tooks[pIndex];
    const base = derived.baseByHand[h]?.[pIndex] ?? 0;
    const remTook = remainingFor(h, pIndex);
    const safeTook = took == null ? "" : Math.min(Number(took), remTook);
    const maxBidOption = Math.min(cc, 9);
    return { isDealer, ordIdx, mustNotPass, forbidExactFill, passDisabled, bid, took, base, remTook, safeTook, maxBidOption };
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold">🎮 თამაში</span>
        <span className="badge">{config.mode === "sequence" ? "რიგითობით" : "ცხრიანები"}</span>
        {config.pairsEnabled && <span className="teamtag">წყვილები</span>}
      </div>

      {/* ── MOBILE: card per hand ─────────────────── */}
      <div className="md:hidden space-y-3">
        {state.bids.map((bids, h) => {
          const cc = ccOf(h);
          const isActive = nextEmpty === h;
          const premNote = derived.premiumNoteByHand[h] || "";
          const exactCount = derived.exactByHand[h]?.reduce((a, b) => a + (b ? 1 : 0), 0) || 0;
          return (
            <div key={h} className={cn("hand-card", isActive && "active")}>
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">#{h + 1}</span>
                  <span className="badge">🃏 {cc}</span>
                  {exactCount > 0 && <span className="badge" style={{color:'#059669'}}>✓ {exactCount}</span>}
                </div>
                {premNote ? <span className="text-[10px] text-indigo-600 font-medium">{premNote}</span> : null}
              </div>
              <div className="grid grid-cols-2 gap-px bg-slate-100 p-px">
                {config.players.map((_, pIndex) => {
                  const p = playerCellProps(h, pIndex);
                  const teamBadgeClass = config.pairsEnabled ? (pIndex % 2 === 0 ? "badge badge-team-a" : "badge badge-team-b") : null;
                  return (
                    <div key={pIndex} className="bg-white p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[80px]">{config.players[pIndex]}</span>
                        <span className="badge">{posLabel[p.ordIdx]}</span>
                        {p.isDealer && <span className="badge-dealer badge">D</span>}
                        {teamBadgeClass && <span className={teamBadgeClass}>{pIndex % 2 === 0 ? "A" : "B"}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <div className="subtle mb-0.5">თქვა</div>
                          <select
                            value={p.bid ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === "") setHandIdx(h, pIndex, "bids", null);
                              else if (v === "-") setHandIdx(h, pIndex, "bids", "-");
                              else setHandIdx(h, pIndex, "bids", Number(v));
                            }}
                            className={cn("sel text-[11px]", (p.mustNotPass || p.forbidExactFill !== null) && "ring-1 ring-amber-400")}
                          >
                            <option value="">—</option>
                            <option value="-" disabled={p.passDisabled || p.mustNotPass}>პასი</option>
                            {Array.from({ length: p.maxBidOption }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n} disabled={p.isDealer && p.forbidExactFill !== null && n === p.forbidExactFill}>{n}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <div className="subtle mb-0.5">აიღო</div>
                          <select
                            value={p.safeTook}
                            onChange={(e) => {
                              const v = e.target.value;
                              setHandIdx(h, pIndex, "tooks", v === "" ? null : Math.min(Number(v), p.remTook));
                            }}
                            className="sel text-[11px]"
                          >
                            <option value="">—</option>
                            {Array.from({ length: p.remTook + 1 }, (_, x) => x).map((x) => (
                              <option key={x} value={x}>{x}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className={cn("text-[10px] font-semibold", scoreColor(p.base))}>
                        {p.base > 0 ? "+" : ""}{p.base}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DESKTOP: table ────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-[960px] w-full text-sm table-fixed">
          <thead>
            <tr>
              <th className="p-2 text-left w-8">#</th>
              <th className="p-2 w-10">🃏</th>
              {config.players.map((p, i) => (
                <th key={i} className="p-2 text-center">{p}</th>
              ))}
              <th className="p-2 w-12">✓</th>
              <th className="p-2 w-36">პრემია</th>
              <th className="p-2 w-16">ჯამი</th>
            </tr>
          </thead>
          <tbody>
            {state.bids.map((bids, h) => {
              const cc = ccOf(h);
              const exactCount = derived.exactByHand[h]?.reduce((a, b) => a + (b ? 1 : 0), 0) || 0;
              const handSum = derived.cumByHand[h];
              const premNote = derived.premiumNoteByHand[h] || "";
              return (
                <tr key={h} className={cn("border-t border-slate-100", nextEmpty === h && "row-active")}>
                  <td className="p-2 align-top text-slate-400 text-xs">{h + 1}</td>
                  <td className="p-2 align-top text-center">
                    <span className="badge">{cc}</span>
                  </td>
                  {config.players.map((_, pIndex) => {
                    const p = playerCellProps(h, pIndex);
                    const teamClass = config.pairsEnabled ? (pIndex % 2 === 0 ? "badge badge-team-a" : "badge badge-team-b") : null;
                    return (
                      <td key={pIndex} className="p-1.5 align-top">
                        <div className="cellbox">
                          <div className="flex items-center gap-1 flex-wrap">
                            {p.isDealer && <span className="badge-dealer badge">D</span>}
                            <span className="badge">{posLabel[p.ordIdx]}</span>
                            {teamClass && <span className={teamClass}>{pIndex % 2 === 0 ? "A" : "B"}</span>}
                          </div>
                          <div className="subtle">თქვა</div>
                          <select
                            value={p.bid ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === "") setHandIdx(h, pIndex, "bids", null);
                              else if (v === "-") setHandIdx(h, pIndex, "bids", "-");
                              else setHandIdx(h, pIndex, "bids", Number(v));
                            }}
                            className={cn("sel", (p.mustNotPass || p.forbidExactFill !== null) && "ring-1 ring-amber-400/70")}
                          >
                            <option value="">—</option>
                            <option value="-" disabled={p.passDisabled || p.mustNotPass}>- (პასი)</option>
                            {Array.from({ length: p.maxBidOption }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n} disabled={p.isDealer && p.forbidExactFill !== null && n === p.forbidExactFill}>{n}</option>
                            ))}
                          </select>
                          <div className="subtle">აიღო</div>
                          <select
                            value={p.safeTook}
                            onChange={(e) => {
                              const v = e.target.value;
                              setHandIdx(h, pIndex, "tooks", v === "" ? null : Math.min(Number(v), p.remTook));
                            }}
                            className="sel"
                          >
                            <option value="">—</option>
                            {Array.from({ length: p.remTook + 1 }, (_, x) => x).map((x) => (
                              <option key={x} value={x}>{x}</option>
                            ))}
                          </select>
                          <span className={cn("text-[11px] font-semibold", scoreColor(p.base))}>
                            {p.base > 0 ? "+" : ""}{p.base}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-2 align-top text-center text-slate-400 text-xs">{exactCount}</td>
                  <td className="p-2 align-top text-[11px] text-indigo-600 font-medium">{premNote}</td>
                  <td className={cn("p-2 align-top text-sm font-bold", scoreColor(handSum))}>{handSum}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[10px] text-slate-400">
        D = დილერი · პოზიციები: პირველი/მეორე/მესამე/ბოლო
        {config.pairsEnabled && " · Team A = 1+3, Team B = 2+4"}
      </div>
    </div>
  );
}

function LiveTotalsCard({ game, derived }) {
  const { players, pairsEnabled } = game.config;
  const teamA = (derived.setCum[0] || 0) + (derived.setCum[2] || 0);
  const teamB = (derived.setCum[1] || 0) + (derived.setCum[3] || 0);
  const maxVal = Math.max(1, ...derived.setCum.map(Math.abs), Math.abs(teamA), Math.abs(teamB));
  const barPct = (v) => Math.min(100, (Math.max(0, v) / maxVal) * 100);
  return (
    <div className="card">
      <div className="text-sm font-semibold mb-3 text-slate-800">📊 მიმდინარე ანგარიში</div>

      {pairsEnabled && (
        <div className="mb-3 pb-3 border-b border-slate-100">
          {[{label:"Team A", val:teamA, bar:barPct(teamA)}, {label:"Team B", val:teamB, bar:barPct(teamB)}].map(({label,val,bar}) => (
            <div key={label} className="flex items-center gap-2 mb-2">
              <div className="w-16 text-[11px] text-slate-500 font-medium">{label}</div>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="bar-fill" style={{width:`${bar}%`}} />
              </div>
              <div className={cn("w-14 text-right text-sm font-bold tabular-nums", scoreColor(val))}>{fmt(val)}</div>
            </div>
          ))}
          <div className="text-[10px] text-slate-400 mt-1">{players[0]}+{players[2]} vs {players[1]}+{players[3]}</div>
        </div>
      )}

      <div className="space-y-2">
        {players.map((p, i) => {
          const val = derived.setCum[i] || 0;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className="w-20 text-[11px] text-slate-500 truncate">{p}</div>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="bar-fill" style={{width:`${barPct(val)}%`}} />
              </div>
              <div className={cn("w-14 text-right text-sm font-bold tabular-nums", scoreColor(val))}>{fmt(val)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryCard({ game, onChange, derived }) {
  const { players, pairsEnabled } = game.config;
  const sets = derived.sets;
  const grand = React.useMemo(() => {
    const g = [0, 0, 0, 0];
    sets.forEach(({ sum }) => sum.forEach((v, i) => (g[i] += v)));
    return g;
  }, [sets, derived]);
  const teamGrand = [grand[0] + grand[2], grand[1] + grand[3]];
  const ScoreCell = ({ v }) => (
    <td className={cn("p-1.5 text-center text-xs tabular-nums font-medium", scoreColor(v))}>{fmt(v)}</td>
  );
  return (
    <div className="card">
      <div className="text-sm font-semibold mb-3 text-slate-800">🗂️ სეტების ისტორია</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[260px]">
          <thead>
            <tr>
              <th className="p-1.5 text-left text-slate-400">სეტი</th>
              {players.map((p, i) => (
                <th key={i} className="p-1.5 text-center text-slate-500 truncate max-w-[60px]">{p}</th>
              ))}
              {pairsEnabled && (
                <>
                  <th className="p-1.5 text-center" style={{color:'#4338ca'}}>A</th>
                  <th className="p-1.5 text-center" style={{color:'#be185d'}}>B</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sets.map(({ index, sum, teamSum }) => (
              <tr key={index} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-1.5 text-slate-400">{index + 1}</td>
                {sum.map((v, i) => <ScoreCell key={i} v={v} />)}
                {pairsEnabled && (
                  <>
                    <ScoreCell v={teamSum?.[0] ?? sum[0] + sum[2]} />
                    <ScoreCell v={teamSum?.[1] ?? sum[1] + sum[3]} />
                  </>
                )}
              </tr>
            ))}
            <tr className="border-t-2 border-slate-200">
              <td className="p-1.5 text-slate-700 font-bold text-xs">ჯამი</td>
              {grand.map((v, i) => (
                <td key={i} className={cn("p-1.5 text-center text-sm font-bold tabular-nums", scoreColor(v))}>{fmt(v)}</td>
              ))}
              {pairsEnabled && (
                <>
                  <td className={cn("p-1.5 text-center text-sm font-bold tabular-nums", scoreColor(teamGrand[0]))}>{fmt(teamGrand[0])}</td>
                  <td className={cn("p-1.5 text-center text-sm font-bold tabular-nums", scoreColor(teamGrand[1]))}>{fmt(teamGrand[1])}</td>
                </>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PrintReport({ game, derived }) {
  const { config } = game;
  const { players, pairsEnabled, mode } = config;
  const sets = derived.sets;

  const grand = React.useMemo(() => {
    const g = [0, 0, 0, 0];
    sets.forEach(({ sum }) => sum.forEach((v, i) => (g[i] += v)));
    return g;
  }, [sets]);
  const teamGrand = [grand[0] + grand[2], grand[1] + grand[3]];

  const winners = pairsEnabled
    ? (() => {
        const max = Math.max(...teamGrand);
        return teamGrand
          .map((v, i) =>
            v === max
              ? i === 0
                ? `Team A (${players[0]} & ${players[2]})`
                : `Team B (${players[1]} & ${players[3]})`
              : null
          )
          .filter(Boolean);
      })()
    : (() => {
        const max = Math.max(...grand);
        return players.filter((_, i) => grand[i] === max);
      })();

  const sc = (v) =>
    v > 0 ? { color: "#059669" } : v < 0 ? { color: "#dc2626" } : { color: "#94a3b8" };

  const TH = ({ children, style }) => (
    <th style={{ padding: "6px 8px", textAlign: "center", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", ...style }}>{children}</th>
  );
  const TD = ({ children, style }) => (
    <td style={{ padding: "5px 8px", textAlign: "center", ...style }}>{children}</td>
  );

  return (
    <div className="print-report" style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "#0f172a", fontSize: "13px", lineHeight: 1.5 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #4f46e5", paddingBottom: "12px", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px" }}>{game.name}</div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
            🃏 Joker Score &nbsp;·&nbsp; {mode === "sequence" ? "რიგითობით" : "ცხრიანები"}{pairsEnabled ? " · წყვილები" : ""}
          </div>
        </div>
        <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "right" }}>
          {new Date().toLocaleDateString("ka-GE", { year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* ── Players ── */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {players.map((p, i) => (
          <div key={i} style={{
            fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px",
            background: pairsEnabled ? (i % 2 === 0 ? "#ede9fe" : "#fce7f3") : "#f1f5f9",
            color: pairsEnabled ? (i % 2 === 0 ? "#4338ca" : "#be185d") : "#475569",
          }}>
            {pairsEnabled ? (i % 2 === 0 ? "A · " : "B · ") : ""}{p}
          </div>
        ))}
      </div>

      {/* ── Sets history ── */}
      <div style={{ marginBottom: "22px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>სეტების ისტორია</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <TH style={{ textAlign: "left" }}>სეტი</TH>
              {players.map((p, i) => <TH key={i}>{p}</TH>)}
              {pairsEnabled && <>
                <TH style={{ color: "#4338ca" }}>Team A</TH>
                <TH style={{ color: "#be185d" }}>Team B</TH>
              </>}
            </tr>
          </thead>
          <tbody>
            {sets.map(({ index, sum, teamSum }) => (
              <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <TD style={{ textAlign: "left", color: "#64748b" }}>{index + 1}</TD>
                {sum.map((v, i) => <TD key={i} style={{ fontWeight: 600, ...sc(v) }}>{fmt(v)}</TD>)}
                {pairsEnabled && <>
                  <TD style={{ fontWeight: 600, ...sc(teamSum?.[0] ?? sum[0] + sum[2]) }}>{fmt(teamSum?.[0] ?? sum[0] + sum[2])}</TD>
                  <TD style={{ fontWeight: 600, ...sc(teamSum?.[1] ?? sum[1] + sum[3]) }}>{fmt(teamSum?.[1] ?? sum[1] + sum[3])}</TD>
                </>}
              </tr>
            ))}
            <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
              <TD style={{ textAlign: "left", fontWeight: 800, color: "#0f172a", fontSize: "13px" }}>ჯამი</TD>
              {grand.map((v, i) => <TD key={i} style={{ fontWeight: 800, fontSize: "14px", ...sc(v) }}>{fmt(v)}</TD>)}
              {pairsEnabled && <>
                <TD style={{ fontWeight: 800, fontSize: "14px", ...sc(teamGrand[0]) }}>{fmt(teamGrand[0])}</TD>
                <TD style={{ fontWeight: 800, fontSize: "14px", ...sc(teamGrand[1]) }}>{fmt(teamGrand[1])}</TD>
              </>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Winner ── */}
      <div style={{ background: "linear-gradient(135deg,#4f46e5,#9333ea)", borderRadius: "12px", padding: "16px 20px", color: "white", textAlign: "center" }}>
        <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", opacity: 0.75, fontWeight: 600 }}>გამარჯვებული{winners.length > 1 ? "ები" : ""}</div>
        <div style={{ fontSize: "20px", fontWeight: 900, marginTop: "4px" }}>🏆 {winners.join(" · ")}</div>
        <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "6px" }}>
          {pairsEnabled
            ? `Team A: ${fmt(teamGrand[0])} · Team B: ${fmt(teamGrand[1])}`
            : grand.map((v, i) => `${players[i]}: ${fmt(v)}`).join(" · ")}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ marginTop: "14px", paddingTop: "8px", borderTop: "1px solid #e2e8f0", fontSize: "10px", color: "#94a3b8", textAlign: "center" }}>
        გენერირებულია Joker Score-ით &nbsp;·&nbsp; {new Date().toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

function FinaleOverlay({ pairsEnabled, derived, players, onClose }) {
  const grand = derived.grandTotals;
  const teamGrand = [grand[0] + grand[2], grand[1] + grand[3]];
  const decideWinners = () => {
    if (pairsEnabled) {
      const max = Math.max(...teamGrand);
      return teamGrand.map((v, i) => (v === max ? (i === 0 ? `Team A (${players[0]} & ${players[2]})` : `Team B (${players[1]} & ${players[3]})`) : null)).filter(Boolean);
    }
    const max = Math.max(...grand);
    return players.filter((_, i) => grand[i] === max);
  };
  const winners = decideWinners();
  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Confetti show={true} />
      <motion.div
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative w-full max-w-sm mx-auto p-8 rounded-3xl shadow-2xl text-center"
        style={{ background: 'linear-gradient(135deg, #4f46e5, #9333ea)' }}
      >
        <div className="text-6xl mb-2">🏆</div>
        <div className="text-xs uppercase tracking-widest text-white/60 font-medium">ფინალი</div>
        <div className="text-2xl font-black mt-1 text-white">
          გამარჯვებული{winners.length > 1 ? "ები" : ""}
        </div>
        <div className="mt-2 text-lg font-bold text-white">{winners.join(" • ")}</div>
        <div className="mt-4 text-xs text-white/70 leading-relaxed">
          {pairsEnabled
            ? `Team A: ${fmt(teamGrand[0])} · Team B: ${fmt(teamGrand[1])}`
            : grand.map((v, i) => `${players[i]}: ${fmt(v)}`).join(" · ")}
        </div>
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 rounded-2xl bg-white text-zinc-900 font-semibold text-sm hover:bg-white/90 transition-all"
        >
          დახურვა
        </button>
      </motion.div>
    </motion.div>
  );
}

function Confetti({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {Array.from({ length: 140 }, (_, i) => i).map((i) => (
            <span
              key={i}
              className="confetti"
              style={{
                left: Math.random() * 100 + "%",
                animationDelay: (Math.random() * 0.8).toFixed(2) + "s",
                animationDuration: (3 + Math.random() * 2).toFixed(2) + "s",
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
          <style>{`
            .confetti {
              position: absolute; top: -10px; width: 8px; height: 14px;
              background: hsl(${Math.floor(Math.random() * 360)} 90% 55%);
              opacity: 0.9; border-radius: 2px; animation: fall 4s linear forwards;
            }
            @keyframes fall { 0% { transform: translateY(-20px) rotate(0deg); }
              100% { transform: translateY(110vh) rotate(720deg); } }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Derived & premium logic (incl. pairs)
function computeDerived(game) {
  const {
    players,
    whistPenalty,
    handsPerSet,
    totalSets,
    mode,
    pairsEnabled,
  } = game.config;
  const { bids, tooks } = game.state;
  const totalHands = bids.length;

  const setSizes =
    mode === "sequence"
      ? sequenceSetSizes()
      : ninesSetSizes(handsPerSet, totalSets);
  const bounds = [];
  let cur = 0;
  for (const len of setSizes) {
    bounds.push({ start: cur, end: Math.min(totalHands, cur + len) - 1 });
    cur += len;
  }

  const baseByHand = bids.map((row, h) =>
    row.map((bid, p) => {
      const wh =
        mode === "sequence" ? -(sequenceHandNumber(h) * 100) : whistPenalty;
      return baseScore(bid, tooks[h][p], wh, h, game.config);
    })
  );
  const exactByHand = bids.map((row, h) =>
    row.map((bid, p) => {
      if (tooks[h][p] == null || bid == null) return false;
      if (bid === "-") return tooks[h][p] === 0;
      return Number(bid) === tooks[h][p];
    })
  );

  const premiumNoteByHand = Array(totalHands).fill("");
  const handTotals = baseByHand.map((r) => r.slice());

  const sets = [];
  const setCum = [0, 0, 0, 0];
  const cumByHand = Array(totalHands).fill(0);

  for (let s = 0; s < bounds.length; s++) {
    const { start, end } = bounds[s];
    if (end < start) {
      sets.push({ index: s, sum: [0, 0, 0, 0], teamSum: [0, 0] });
      continue;
    }

    const baseWin = baseByHand.slice(start, end + 1);
    const exactWin = exactByHand.slice(start, end + 1);

    // winners: players who were exact on every hand in this set
    const winners = [0, 1, 2, 3].filter((p) =>
      exactWin.every((r) => r[p] === true)
    );

    const maxBase = [0, 1, 2, 3].map((p) =>
      Math.max(...baseWin.map((r) => r[p] || 0))
    );
    let premiumAdj = [0, 0, 0, 0];
    let deductAdj = [0, 0, 0, 0];

    if (!pairsEnabled) {
      if (winners.length === 1) {
        const wp = winners[0];
        premiumAdj[wp] = maxBase[wp];
        for (let i = 0; i < 4; i++) if (i !== wp) deductAdj[i] = maxBase[i];
      } else if (winners.length >= 2) {
        winners.forEach((wp) => {
          premiumAdj[wp] = maxBase[wp];
        });
      }
    } else {
      // Pair logic: Team A = [0,2], Team B = [1,3]
      const teamA_any = winners.includes(0) || winners.includes(2);
      const teamB_any = winners.includes(1) || winners.includes(3);
      const teamA_all = winners.includes(0) && winners.includes(2);
      const teamB_all = winners.includes(1) && winners.includes(3);

      if (teamA_any && teamB_any) {
        // Both teams have at least one winner → neutral
      } else if (teamA_any && !teamB_any) {
        if (teamA_all) {
          // Both teammates exact → both get +maxBase, no deduction
          premiumAdj[0] = maxBase[0];
          premiumAdj[2] = maxBase[2];
        } else {
          // Only one teammate exact → that player +maxBase, both opponents -maxBase
          winners.filter((p) => p === 0 || p === 2).forEach((wp) => {
            premiumAdj[wp] = maxBase[wp];
          });
          deductAdj[1] = maxBase[1];
          deductAdj[3] = maxBase[3];
        }
      } else if (teamB_any && !teamA_any) {
        if (teamB_all) {
          // Both teammates exact → both get +maxBase, no deduction
          premiumAdj[1] = maxBase[1];
          premiumAdj[3] = maxBase[3];
        } else {
          // Only one teammate exact → that player +maxBase, both opponents -maxBase
          winners.filter((p) => p === 1 || p === 3).forEach((wp) => {
            premiumAdj[wp] = maxBase[wp];
          });
          deductAdj[0] = maxBase[0];
          deductAdj[2] = maxBase[2];
        }
      }
      // else: no winners at all → nothing
    }

    const lastH = end;
    for (let p = 0; p < 4; p++) {
      handTotals[lastH][p] += premiumAdj[p] - deductAdj[p];
    }
    if (winners.length > 0) {
      if (!pairsEnabled) {
        premiumNoteByHand[lastH] = winners.length === 1
          ? `+პრემია ${players[winners[0]]}`
          : `+პრემია (${winners.length})`;
      } else {
        const teamA_any = winners.includes(0) || winners.includes(2);
        const teamB_any = winners.includes(1) || winners.includes(3);
        const teamA_all = winners.includes(0) && winners.includes(2);
        const teamB_all = winners.includes(1) && winners.includes(3);
        if (teamA_any && teamB_any) {
          premiumNoteByHand[lastH] = "ნეიტრალი (ორივე გუნდი)";
        } else if (teamA_any) {
          const wp = winners.find((p) => p === 0 || p === 2);
          premiumNoteByHand[lastH] = teamA_all
            ? "Team A: +პრემია ×2"
            : `${players[wp]}: +პრ / B−`;
        } else if (teamB_any) {
          const wp = winners.find((p) => p === 1 || p === 3);
          premiumNoteByHand[lastH] = teamB_all
            ? "Team B: +პრემია ×2"
            : `${players[wp]}: +პრ / A−`;
        }
      }
    }

    const setTotals = [0, 0, 0, 0];
    for (let h = start; h <= end; h++) {
      for (let p = 0; p < 4; p++) {
        setCum[p] += handTotals[h][p];
        setTotals[p] += handTotals[h][p];
      }
      cumByHand[h] = Math.max(...setCum);
    }
    sets.push({
      index: s,
      sum: setTotals,
      teamSum: [setTotals[0] + setTotals[2], setTotals[1] + setTotals[3]],
    });
    for (let p = 0; p < 4; p++) setCum[p] = 0;
  }

  const lastHandDone = (function () {
    let last = -1;
    for (let h = 0; h < bids.length; h++) {
      const rowDone =
        bids[h].every((v) => v !== null) && tooks[h].every((v) => v !== null);
      if (rowDone) last = h;
      else break;
    }
    return last;
  })();
  const setSizesArr = setSizes;
  const setIndex = (() => {
    let acc = 0;
    for (let i = 0; i < setSizesArr.length; i++) {
      const len = setSizesArr[i];
      if (lastHandDone < acc + len) return i;
      acc += len;
    }
    return setSizesArr.length - 1;
  })();
  const setStart = bounds[setIndex]?.start ?? 0;
  const setEnd = bounds[setIndex]?.end ?? -1;
  const setCumLive = [0, 0, 0, 0];
  for (let h = setStart; h <= setEnd; h++) {
    for (let p = 0; p < 4; p++) setCumLive[p] += handTotals[h][p];
  }

  const grandTotals = [0, 0, 0, 0];
  sets.forEach(({ sum }) => sum.forEach((v, i) => (grandTotals[i] += v)));

  return {
    baseByHand,
    exactByHand,
    premiumNoteByHand,
    handTotals,
    cumByHand,
    sets,
    setCum: setCumLive,
    grandTotals,
    handsDone: 1 + lastHandDone,
  };
}
