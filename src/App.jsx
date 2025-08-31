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
    if (config?.mode === "sequence") {
      const seqHandNum = sequenceHandNumber(handIndex);
      if (seqHandNum === b) return b * 100;
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white">
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
      <div className="max-w-7xl px-4 pb-24">
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
    <div className="sticky top-0 z-40 backdrop-blur bg-black/40 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="text-xl font-bold">🃏 Joker Score</div>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500"
            onClick={onNew}
          >
            ახალი თამაში
          </button>
          <GamesDropdown
            games={games}
            setActiveId={setActiveId}
            onRename={onRename}
            onDelete={onDelete}
          />
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-sm">
            {user.name}
          </div>
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
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-sm"
      >
        სესიები
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 mt-2 w-96 bg-zinc-900/95 border border-white/10 rounded-2xl shadow-xl p-2 max-h-96 overflow-auto"
          >
            {games.length === 0 ? (
              <div className="p-4 text-sm text-zinc-400">
                არ არის შენახული თამაშები
              </div>
            ) : (
              games.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5"
                >
                  {editingId === g.id ? (
                    <input
                      autoFocus
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={() => {
                        onRename(g.id, tempName || g.name);
                        setEditingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onRename(g.id, tempName || g.name);
                          setEditingId(null);
                        }
                      }}
                    />
                  ) : (
                    <button
                      className="flex-1 text-left"
                      onClick={() => {
                        setActiveId(g.id);
                        setOpen(false);
                      }}
                    >
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-zinc-400">
                        რეჟიმი:{" "}
                        {g.config.mode === "sequence"
                          ? "რიგითობით"
                          : "ცხრიანები"}{" "}
                        {g.config.pairsEnabled ? "• წყვილები" : ""}
                      </div>
                    </button>
                  )}
                  <button
                    className="text-xs text-zinc-400 hover:text-white"
                    onClick={() => {
                      setEditingId(g.id);
                      setTempName(g.name);
                    }}
                  >
                    რედ.
                  </button>
                  <button
                    className="text-xs text-rose-400 hover:text-rose-300"
                    onClick={() => onDelete(g.id)}
                  >
                    წაშლა
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
    <div className="min-h-[60vh] grid place-items-center">
      <div className="text-center max-w-xl">
        <div className="text-6xl">🃏</div>
        <h1 className="text-3xl font-bold mt-2">
          ჯოკერის თანამედროვე სკორ-პლატფორმა
        </h1>
        <p className="text-zinch-400 mt-2">
          აირჩიე რეჟიმი და დაიწყე ქულების ჩათვლა ავტომატურად.
        </p>
        <button
          className="mt-6 px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500"
          onClick={onCreate}
        >
          დაწყება
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
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white">
      <div className="w-full max-w-md p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur">
        <div className="text-2xl font-bold">რეგისტრაცია</div>
        <div className="mt-4 space-y-3">
          <div>
            <div className="text-sm mb-1">სახელი</div>
            <input
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="მაგ. ნიკა"
            />
          </div>
          <div>
            <div className="text-sm mb-1">Email</div>
            <input
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <button
            disabled={!can}
            onClick={() => onDone({ id: uid(), name, email })}
            className={cn(
              "w-full px-4 py-2 rounded-2xl transition",
              can
                ? "bg-indigo-600 hover:bg-indigo-500"
                : "bg-zinc-700 cursor-not-allowed"
            )}
          >
            შესვლა
          </button>
          <div className="text-xs text-zinc-400">
            ლოკალური დემო – მონაცემები ინახება ბრაუზერში.
          </div>
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

  return (
    <div className="py-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2 space-y-6 manual-width">
          <ConfigCard game={game} onChange={onChange} setMode={setMode} />
          <PlayTable
            game={game}
            onChange={onChange}
            derived={derived}
            dealerOf={dealerOf}
          />
        </div>
        <div className="space-y-6 sidebar-sticky md:hidden">
          <LiveTotalsCard game={game} derived={derived} />
          <HistoryCard game={game} onChange={onChange} derived={derived} />
        </div>
      </div>
      <div className="hidden md:block">
        <div className="fixed right-4 top-[72px] w-[500px] z-30 space-y-6">
          <LiveTotalsCard game={game} derived={derived} />
          <HistoryCard game={game} onChange={onChange} derived={derived} />
        </div>
      </div>

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
  const sizes =
    config.mode === "sequence"
      ? sequenceSetSizes()
      : ninesSetSizes(config.handsPerSet, config.totalSets);
  const totalHands = sizes.reduce((a, b) => a + b, 0);
  const passUsed = (pi) =>
    game.state.bids.flat().filter((b, ix) => ix % 4 === pi && b === "-").length;
  return (
    <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-lg font-semibold">⚙️ პარამეტრები</div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="რეჟიმი">
          <select
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10"
            value={config.mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="9s">ცხრიანები</option>
            <option value="sequence">რიგითობით</option>
          </select>
        </Field>
        {config.mode === "sequence" ? (
          <Field label="Whist (ხიშტი) ჯარიმა">
            <div className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm">
              ავტომატური: −(დარიგება × 100). მაგ: 2-2 → −200, 9-9 → −900.
            </div>
          </Field>
        ) : (
          <>
            <Field label="Whist (ხიშტი) ჯარიმა">
              <input
                type="number"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10"
                value={config.whistPenalty}
                onChange={(e) =>
                  onChange({
                    ...game,
                    config: { ...config, whistPenalty: Number(e.target.value) },
                  })
                }
              />
            </Field>
            <Field label="ხელები სეტში / სეტების რაოდენობა">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10"
                  value={config.handsPerSet}
                  onChange={(e) => {
                    const v = clamp(Number(e.target.value) || 4, 1, 50);
                    const clone = structuredClone(game);
                    clone.config.handsPerSet = v;
                    const sizes = ninesSetSizes(v, clone.config.totalSets);
                    const totalHands = sizes.reduce((a, b) => a + b, 0);
                    const cur = clone.state.bids.length;
                    if (totalHands > cur) {
                      const add = Array.from(
                        { length: totalHands - cur },
                        () => [null, null, null, null]
                      );
                      clone.state.bids = [...clone.state.bids, ...add];
                      clone.state.tooks = [...clone.state.tooks, ...add];
                    } else if (totalHands < cur) {
                      clone.state.bids = clone.state.bids.slice(0, totalHands);
                      clone.state.tooks = clone.state.tooks.slice(
                        0,
                        totalHands
                      );
                    }
                    onChange(clone);
                  }}
                />
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10"
                  value={config.totalSets}
                  onChange={(e) => {
                    const v = clamp(Number(e.target.value) || 4, 1, 50);
                    const clone = structuredClone(game);
                    clone.config.totalSets = v;
                    const sizes = ninesSetSizes(clone.config.handsPerSet, v);
                    const totalHands = sizes.reduce((a, b) => a + b, 0);
                    const cur = clone.state.bids.length;
                    if (totalHands > cur) {
                      const add = Array.from(
                        { length: totalHands - cur },
                        () => [null, null, null, null]
                      );
                      clone.state.bids = [...clone.state.bids, ...add];
                      clone.state.tooks = [...clone.state.tooks, ...add];
                    } else if (totalHands < cur) {
                      clone.state.bids = clone.state.bids.slice(0, totalHands);
                      clone.state.tooks = clone.state.tooks.slice(
                        0,
                        totalHands
                      );
                    }
                    onChange(clone);
                  }}
                />
              </div>
            </Field>
          </>
        )}
        <Field label="პასების შეზღუდვა (თითო მოთამაშე, 4-ჯერ)">
          <div className="flex items-center gap-3">
            <input
              id="passlimit"
              type="checkbox"
              checked={config.passLimitEnabled}
              onChange={(e) =>
                onChange({
                  ...game,
                  config: { ...config, passLimitEnabled: e.target.checked },
                })
              }
            />
            <label htmlFor="passlimit" className="text-sm">
              ჩართე
            </label>
          </div>
          {config.passLimitEnabled && (
            <div className="text-xs text-zinc-400 mt-1">
              დარჩენილი პასები —{" "}
              {game.config.players
                .map((_, i) => 4 - passUsed(i))
                .map((r, i) => `${game.config.players[i]}: ${Math.max(0, r)}`)
                .join(" · ")}
            </div>
          )}
        </Field>
        <Field label="წყვილები">
          <div className="flex items-center gap-3">
            <input
              id="pairs"
              type="checkbox"
              checked={config.pairsEnabled}
              onChange={(e) =>
                onChange({
                  ...game,
                  config: { ...config, pairsEnabled: e.target.checked },
                })
              }
            />
            <label htmlFor="pairs" className="text-sm">
              ჩართე (1&3 vs 2&4)
            </label>
          </div>
          {config.pairsEnabled && (
            <div className="mt-2 grid md:grid-cols-2 gap-2 text-xs text-zinc-300">
              <div>
                Team A: {config.players[0]} + {config.players[2]}
              </div>
              <div>
                Team B: {config.players[1]} + {config.players[3]}
              </div>
              <div className="md:col-span-2">
                <div className="text-[11px] text-zinc-400 mb-1">
                  პრემიის პოლიტიკა (როდესაც ორივე თანაგუნდელი სეტში სრულად
                  ზუსტია):
                </div>
                <select
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10"
                  value={config.teamPremiumMode}
                  onChange={(e) =>
                    onChange({
                      ...game,
                      config: { ...config, teamPremiumMode: e.target.value },
                    })
                  }
                >
                  <option value="both_add">
                    ორივეს დაემატოს მათი მაქს. ქულა
                  </option>
                  <option value="opp_deduct">
                    მხოლოდ მეორე გუნდს მოაკლდეს მათი მაქს. ქულა
                  </option>
                </select>
              </div>
            </div>
          )}
        </Field>
        <Field label="დამწყები დილერი (ბოლო ბიდერი)">
          <select
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10"
            value={config.startDealerIndex}
            onChange={(e) =>
              onChange({
                ...game,
                config: { ...config, startDealerIndex: Number(e.target.value) },
              })
            }
          >
            {config.players.map((p, i) => (
              <option key={i} value={i}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        {config.players.map((p, i) => (
          <div key={i}>
            <div className="text-xs text-zinc-400 mb-1">მოთამაშე {i + 1}</div>
            <input
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10"
              value={p}
              onChange={(e) =>
                onChange({
                  ...game,
                  config: {
                    ...config,
                    players: config.players.map((x, ix) =>
                      ix === i ? e.target.value : x
                    ),
                  },
                })
              }
            />
          </div>
        ))}
      </div>
      <div className="text-xs text-zinc-400 mt-3">
        სულ ხელები: {totalHands} {config.mode === "sequence" && "(8+4+8+4)"}
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs text-zinc-400 mb-1">{label}</div>
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
      (acc, v, ix) => acc + (ix === me || v == null ? 0 : Number(v)),
      0
    );
    return Math.min(s, cc);
  };
  const remainingFor = (h, me) => {
    const cc = ccOf(h);
    const rem = cc - sumOthersTook(h, me);
    return rem < 0 ? 0 : rem;
  };

  const passUsedExcept = (playerIndex, handIndex) => {
    let used = 0;
    for (let h = 0; h < state.bids.length; h++) {
      for (let p = 0; p < 4; p++) {
        if (p === playerIndex && h !== handIndex) {
          if (state.bids[h][p] === "-") used++;
        }
      }
    }
    return used;
  };

  const nextEmpty = React.useMemo(() => {
    for (let h = 0; h < totalHands; h++) {
      const bids = state.bids[h];
      const tooks = state.tooks[h];
      if (bids.some((x) => x == null) || tooks.some((x) => x == null)) return h;
    }
    return totalHands - 1;
  }, [state, totalHands]);

  return (
    <div className="p-5 rounded-3xl bg-white/5 border border-white/10 overflow-x-auto">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-lg font-semibold">🎮 თამაში</div>
        <div className="text-sm text-zinc-400">
          რეჟიმი: {config.mode === "sequence" ? "რიგითობით" : "ცხრიანები"}{" "}
          {config.pairsEnabled && (
            <span className="teamtag ml-2">წყვილები</span>
          )}
        </div>
      </div>

      <table className="min-w-[1100px] w-full text-sm table-fixed">
        <thead className="text-zinc-300">
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2">დარიგება</th>
            {config.players.map((_, i) => (
              <th key={i} className="p-2"></th>
            ))}
            <th className="p-2">ზუსტი</th>
            <th className="p-2">პრემია± (სეტის ბოლოს)</th>
            <th className="p-2">ჯამი (სეტში)</th>
          </tr>
        </thead>
        <tbody>
          {state.bids.map((bids, h) => {
            const tooks = state.tooks[h];
            const dealer = dealerOf(h);
            const cc = ccOf(h);

            const posLabel = ["პირველი", "მეორე", "მესამე", "ბოლო"];

            const exactCount =
              derived.exactByHand[h]?.reduce((a, b) => a + (b ? 1 : 0), 0) || 0;
            const handSum = derived.cumByHand[h];
            const premNote = derived.premiumNoteByHand[h] || "";

            return (
              <tr
                key={h}
                className={
                  "border-t border-white/10 " +
                  (nextEmpty === h ? "bg-white/5" : "")
                }
              >
                <td className="p-2 align-top">{h + 1}</td>
                <td className="p-2 align-top text-zinc-300">{cc}</td>

                {config.players.map((_, pIndex) => {
                  const delta = (pIndex - dealer + 4) % 4;
                  const ordIdx = delta === 0 ? 3 : delta - 1;
                  const isDealer = pIndex === dealer;
                  const cap = config.mode === "sequence" ? cc : 9;

                  const othersSumBidTotal = state.bids[h].reduce(
                    (acc, v, ix) =>
                      acc +
                      (ix === pIndex || v == null || v === "-" ? 0 : Number(v)),
                    0
                  );

                  // Dealer constraints on bids
                  let mustNotPass = false;
                  let forbidExactFill = null;
                  if (isDealer) {
                    if (othersSumBidTotal === cap) {
                      mustNotPass = true;
                    } else if (othersSumBidTotal < cap) {
                      forbidExactFill = cap - othersSumBidTotal;
                    } else {
                      /* others > cap: free */
                    }
                  }

                  const usedPasses = passUsedExcept(pIndex, h);
                  const remainingPasses = config.passLimitEnabled
                    ? Math.max(0, (config.passLimitPerPlayer || 4) - usedPasses)
                    : Infinity;
                  const currentIsPass = bids[pIndex] === "-";
                  const passDisabled = config.passLimitEnabled
                    ? !currentIsPass && remainingPasses <= 0
                    : false;

                  const bid = bids[pIndex];
                  const took = tooks[pIndex];
                  const base = derived.baseByHand[h]?.[pIndex] ?? 0;

                  const remTook = remainingFor(h, pIndex);
                  const safeTook =
                    took == null ? "" : Math.min(Number(took), remTook);

                  const maxBidOption = Math.min(cc, 9);

                  return (
                    <td key={pIndex} className="p-2 align-top w-[240px]">
                      <div className="cellbox">
                        <div className="playername flex items-center gap-1">
                          <span className="nm">
                            {game.config.players[pIndex]}
                          </span>{" "}
                          <span className="badge">{posLabel[ordIdx]}</span>
                          {config.pairsEnabled && (
                            <span className="badge ml-1">
                              {pIndex % 2 === 0 ? "Team A" : "Team B"}
                            </span>
                          )}
                        </div>

                        <div className="subtle">თქვა</div>
                        <select
                          value={bid ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") setHandIdx(h, pIndex, "bids", null);
                            else if (v === "-")
                              setHandIdx(h, pIndex, "bids", "-");
                            else setHandIdx(h, pIndex, "bids", Number(v));
                          }}
                          className={cn(
                            "sel",
                            (mustNotPass || forbidExactFill !== null) &&
                              "ring-2 ring-amber-400"
                          )}
                        >
                          <option value="">—</option>
                          <option
                            value="-"
                            disabled={passDisabled || mustNotPass}
                          >
                            - (პასი)
                          </option>
                          {Array.from(
                            { length: maxBidOption },
                            (_, i) => i + 1
                          ).map((n) => (
                            <option
                              key={n}
                              value={n}
                              disabled={
                                isDealer &&
                                forbidExactFill !== null &&
                                n === forbidExactFill
                              }
                            >
                              {n}
                            </option>
                          ))}
                        </select>

                        <div className="subtle">აიღო</div>
                        <select
                          value={safeTook}
                          onChange={(e) => {
                            const v = e.target.value;
                            const num =
                              v === "" ? null : Math.min(Number(v), remTook);
                            setHandIdx(h, pIndex, "tooks", num);
                          }}
                          className="sel"
                        >
                          <option value="">—</option>
                          {Array.from({ length: remTook + 1 }, (_, x) => x).map(
                            (x) => (
                              <option key={x} value={x}>
                                {x}
                              </option>
                            )
                          )}
                        </select>

                        <div className="mt-1 text-zinc-300">
                          <span className="badge">base {base}</span>
                        </div>
                      </div>
                    </td>
                  );
                })}

                <td className="p-2 text-zinc-300">{exactCount}</td>
                <td className="p-2 text-zinc-200">{premNote}</td>
                <td className="p-2 font-semibold">{handSum}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-3 text-xs text-zinc-400">
        * დილერი თითო ხელზე მორიგეობით იცვლება. პოზიციები:
        პირველი/მეორე/მესამე/ბოლო.{" "}
        {config.pairsEnabled &&
          "წყვილები ჩართულია: Team A = 1+3, Team B = 2+4."}
      </div>
    </div>
  );
}

function LiveTotalsCard({ game, derived }) {
  const { players, pairsEnabled } = game.config;
  const teamA = (derived.setCum[0] || 0) + (derived.setCum[2] || 0);
  const teamB = (derived.setCum[1] || 0) + (derived.setCum[3] || 0);
  return (
    <div className="p-5 rounded-5xl bg-white/5 border border-white/10">
      <div className="text-lg font-semibold mb-3">📊 მიმდინარე ანგარიში</div>

      {pairsEnabled && (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="w-28 text-zinc-300">Team A</div>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500/80"
                style={{
                  width: `${Math.min(
                    100,
                    (Math.max(0, teamA) / Math.max(1, Math.max(teamA, teamB))) *
                      100
                  )}%`,
                }}
              />
            </div>
            <div className="w-16 text-right font-semibold">{teamA}</div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-28 text-zinc-300">Team B</div>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500/80"
                style={{
                  width: `${Math.min(
                    100,
                    (Math.max(0, teamB) / Math.max(1, Math.max(teamA, teamB))) *
                      100
                  )}%`,
                }}
              />
            </div>
            <div className="w-16 text-right font-semibold">{teamB}</div>
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            {players[0]}+{players[2]} vs {players[1]}+{players[3]}
          </div>
          <div className="border-t border-white/10 my-3"></div>
        </div>
      )}

      <div className="space-y-2">
        {players.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-28 text-zinc-300">{p}</div>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500/80"
                style={{
                  width: `${Math.min(
                    100,
                    (Math.max(0, derived.setCum[i] || 0) /
                      Math.max(1, Math.max(...derived.setCum))) *
                      100
                  )}%`,
                }}
              />
            </div>
            <div className="w-16 text-right font-semibold">
              {derived.setCum[i] || 0}
            </div>
          </div>
        ))}
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
  return (
    <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
      <div className="text-lg font-semibold mb-3">🗂️ სეტების ისტორია</div>
      <table className="w-full text-sm">
        <thead className="text-zinc-300">
          <tr>
            <th className="p-2 text-left">სეტი</th>
            {players.map((p, i) => (
              <th key={i} className="p-2">
                {p}
              </th>
            ))}
            {pairsEnabled && (
              <>
                <th className="p-2">Team A</th>
                <th className="p-2">Team B</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sets.map(({ index, sum, teamSum }) => (
            <tr key={index} className="border-t border-white/10">
              <td className="p-2">{index + 1}</td>
              {sum.map((v, i) => (
                <td key={i} className="p-2">
                  {v}
                </td>
              ))}
              {pairsEnabled && (
                <>
                  <td className="p-2">{teamSum?.[0] ?? sum[0] + sum[2]}</td>
                  <td className="p-2">{teamSum?.[1] ?? sum[1] + sum[3]}</td>
                </>
              )}
            </tr>
          ))}
          <tr className="border-t border-white/10 font-semibold">
            <td className="p-2">ჯამი</td>
            {grand.map((v, i) => (
              <td key={i} className="p-2">
                {v}
              </td>
            ))}
            {pairsEnabled && (
              <>
                <td className="p-2">{teamGrand[0]}</td>
                <td className="p-2">{teamGrand[1]}</td>
              </>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function FinaleOverlay({ pairsEnabled, derived, players, onClose }) {
  const grand = derived.grandTotals;
  const teamGrand = [grand[0] + grand[2], grand[1] + grand[3]];
  const decideWinners = () => {
    if (pairsEnabled) {
      const max = Math.max(...teamGrand);
      const winnersIdx = teamGrand
        .map((v, i) => (v === max ? i : null))
        .filter((x) => x != null);
      const winners = winnersIdx.map((i) =>
        i === 0
          ? `Team A (${players[0]} & ${players[2]})`
          : `Team B (${players[1]} & ${players[3]})`
      );
      return winners;
    } else {
      const max = Math.max(...grand);
      return players.filter((_, i) => grand[i] === max);
    }
  };
  const winners = decideWinners();
  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Confetti show={true} />
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-xl p-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 shadow-2xl"
      >
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-6xl">
          🏆
        </div>
        <div className="text-center mt-6">
          <div className="text-sm uppercase tracking-widest text-white/80">
            ფინალი
          </div>
          <div className="text-3xl font-black mt-1">
            გამარჯვებული{winners.length > 1 ? "ები" : ""}
          </div>
          <div className="mt-3 text-xl font-semibold">
            {winners.join(" • ")}
          </div>
          <div className="mt-4 text-sm text-white/90">
            {pairsEnabled
              ? `საბოლოო ქულები — Team A: ${teamGrand[0]} · Team B: ${teamGrand[1]}`
              : `საბოლოო ქულები: ${grand
                  .map((v, i) => `${players[i]}: ${v}`)
                  .join(" · ")}`}
          </div>
          <button
            onClick={onClose}
            className="mt-6 px-5 py-2 rounded-2xl bg-white/90 text-black hover:bg-white"
          >
            დახურვა
          </button>
        </div>
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
    teamPremiumMode,
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
      const teamA_all = winners.includes(0) && winners.includes(2);
      const teamB_all = winners.includes(1) && winners.includes(3);
      if (teamA_all && !teamB_all) {
        if (teamPremiumMode === "both_add") {
          premiumAdj[0] = maxBase[0];
          premiumAdj[2] = maxBase[2];
        } else if (teamPremiumMode === "opp_deduct") {
          deductAdj[1] = maxBase[1];
          deductAdj[3] = maxBase[3];
        }
      } else if (teamB_all && !teamA_all) {
        if (teamPremiumMode === "both_add") {
          premiumAdj[1] = maxBase[1];
          premiumAdj[3] = maxBase[3];
        } else if (teamPremiumMode === "opp_deduct") {
          deductAdj[0] = maxBase[0];
          deductAdj[2] = maxBase[2];
        }
      } else if (teamA_all && teamB_all) {
        // both teams perfect: neutral
      } else {
        // only single players perfect in pairs mode: no extra
      }
    }

    const lastH = end;
    for (let p = 0; p < 4; p++) {
      handTotals[lastH][p] += premiumAdj[p] - deductAdj[p];
    }
    if (winners.length > 0) {
      premiumNoteByHand[lastH] = !pairsEnabled
        ? winners.length === 1
          ? `+პრემია ${players[winners[0]]}`
          : `+პრემია (${winners.length})`
        : winners.includes(0) && winners.includes(2)
        ? teamPremiumMode === "both_add"
          ? "Team A პრემია (+)"
          : "Team A → Opp −"
        : winners.includes(1) && winners.includes(3)
        ? teamPremiumMode === "both_add"
          ? "Team B პრემია (+)"
          : "Team B → Opp −"
        : "შუალედური ზუსტი";
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
