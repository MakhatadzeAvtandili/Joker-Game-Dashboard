# 🃏 Joker Score – პროექტის სრული ანალიზი

## პროექტის იდეა

**Joker Score** არის ქართული ბარათის თამაშის **„ჯოკერის"** ქულების ჩამწერი და გამანაწილებელი ვებ-აპლიკაცია.
ავტომატურად ითვლის ქულებს, მართავს სეტებს, პრემიებს, ჯარიმებს, გუნდურ ქულებს და ბოლოს გამარჯვებულს.
მუშაობს სრულად ბრაუზერში (localStorage), backend არ სჭირდება.

**Live URL:** https://makhatadzeavtandili.github.io/Joker-Game-Dashboard/

---

## ტექნოლოგიური სტეკი

| ინსტრუმენტი | ვერსია | დანიშნულება |
|---|---|---|
| React | ^18.2.0 | UI framework |
| Vite | ^7.1.3 | Build tool / dev server |
| TailwindCSS | ^3.4.10 | Styling |
| framer-motion | ^11.0.0 | ანიმაციები (AnimatePresence, motion) |
| PostCSS + Autoprefixer | ^8.4.41 / ^10.4.20 | CSS processing |

---

## ფაილური სტრუქტურა

```
Joker-Game-Dashboard/
├── .github/
│   └── workflows/          # GitHub Actions (GitHub Pages deploy)
├── dist/                   # Build output (Vite)
│   ├── assets/
│   └── index.html
├── screenshots/            # UI screenshots for README
├── src/
│   ├── App.jsx             # მთელი აპლიკაცია (1337 ხაზი, ერთი ფაილი)
│   ├── index.css           # Global styles + Tailwind directives + custom classes
│   ├── input.css           # ცარიელი (placeholder)
│   └── main.jsx            # React entry point (ReactDOM.createRoot)
├── index.html              # Vite HTML template
├── package.json            # Dependencies & scripts
├── postcss.config.js       # PostCSS config
├── tailwind.config.js      # Tailwind config (src/ scan)
├── vite.config.js          # Vite config (base: /Joker-Game-Dashboard/)
└── README.md               # პროექტის დოკუმენტაცია
```

---

## App.jsx – კომპონენტების რუქა

### უტილები / კონსტანტები (ზედა დონე)

| სახელი | ტიპი | აღწერა |
|---|---|---|
| `EXACT_MAP` | const | bid 1–9 → exact score mapping (100, 150…900) |
| `clamp(n,a,b)` | fn | რიცხვის დამჭერი min/max-ს შორის |
| `uid()` | fn | random unique id (Math.random + base36) |
| `cn(...xs)` | fn | className combiner (truthy join) |
| `LS_USER`, `LS_GAMES` | const | localStorage key სახელები |
| `loadUser/saveUser` | fn | localStorage read/write for user |
| `loadGames/saveGames` | fn | localStorage read/write for games array |

### ლოგიკური ფუნქციები

| ფუნქცია | აღწერა |
|---|---|
| `sequenceSetSizes()` | → `[8, 4, 8, 4]` — „რიგითობით" სეტების ხელების რაოდენობა |
| `ninesSetSizes(handsPerSet, totalSets)` | → array of equal-size sets for „ცხრიანები" |
| `sequenceHandNumber(index)` | Sequence რეჟიმის ხელის ნომერი (1→9→1→9 pattern მასივიდან) |
| `baseScore(bid, took, whist, handIndex, config)` | **მთავარი სკორ-ფუნქცია** — ითვლის ერთი მოთამაშის ქულას ერთ ხელზე |
| `createNewGame()` | ახალი თამაშის default object-ის შემქმნელი |
| `computeDerived(game)` | **მთავარი ლოგიკური ძრავა** — ყველა წარმოებული მონაცემი |

### `baseScore` ლოგიკა
- `bid === "-"` (პასი): took=0 → +50; took>0 → took×10
- `bid == null` (არ ითქვა): took×10
- `took === bid` (ზუსტი): EXACT_MAP[b] (sequence-ში ასევე b×100 თუ ხელი=bid)
- `took === 0` (whist): whist penalty
- სხვა: took×10

---

## React კომპონენტები

### `App` (root)
- **State:** `user` (localStorage), `games[]`, `activeId`
- Auth guard: თუ user=null → `<Auth>`
- Renders: `<Header>` + active game-ის `<GameEditor>` ან `<EmptyState>`

### `Auth`
- ველები: სახელი + email (basic validation: name>1 char, email contains @)
- localStorage-ში ინახება `{id, name, email}`
- **შენიშვნა:** local demo only, no real auth

### `Header`
- Sticky top bar, backdrop-blur
- ახალი თამაშის ღილაკი, `<GamesDropdown>`, user name badge

### `GamesDropdown`
- AnimatePresence dropdown სესიების სიით
- Inline rename (input field) + delete per game
- აჩვენებს რეჟიმს და წყვილების სტატუსს

### `EmptyState`
- Full-screen centered placeholder, „დაწყება" ღილაკი

### `GameEditor`
- **Props:** `game`, `onChange`
- **State:** `showFinale`
- Layout: 2-column grid (main content left, fixed sidebar right on desktop)
- ითვლის `derived = computeDerived(game)`
- ავტომატურად აჩვენებს `<FinaleOverlay>` როცა ყველა ხელი დასრულებულია
- Renders: `<ConfigCard>`, `<PlayTable>`, `<LiveTotalsCard>`, `<HistoryCard>`

### `ConfigCard`
- **სეტინგები:**
  - რეჟიმი: „ცხრიანები" | „რიგითობით"
  - Whist penalty (ცხრიანებში — input; sequence-ში ავტომატური)
  - ხელები სეტში / სეტების რაოდენობა (ცხრიანებში)
  - პასების ლიმიტი (checkbox, default 4/player)
  - წყვილები (checkbox, 1&3 vs 2&4)
  - გუნდური პრემია: `both_add` | `opp_deduct`
  - დამწყები დილერი
  - 4 მოთამაშის სახელები

### `PlayTable`
- მთავარი თამაშის ცხრილი
- **სვეტები:** # | დარიგება | [4 მოთამაშე] | ზუსტი | პრემია± | ჯამი
- თითო მოთამაშის cell-ში:
  - bid select (0–9, პასი, dealer constraints)
  - took select (0–remaining)
  - base score badge
- **Dealer logic:**
  - dealer არ შეიძლება bid-ი = (cap − othersSum) → ring-2 amber warning
  - dealer-ს არ შეუძლია pass თუ othersBids = cap
- **Pass limit:** passLimitEnabled → max 4 pass/player
- `nextEmpty` highlight — current active hand

### `LiveTotalsCard`
- Fixed sidebar card
- Progress bars (individual + team if pairsEnabled)
- Live cumulative scores of current set

### `HistoryCard`
- Fixed sidebar card
- ყველა სეტის ისტორია (per-set totals)
- Grand total row
- Team columns if pairsEnabled

### `FinaleOverlay`
- Full-screen modal, AnimatePresence
- `<Confetti>` კომპონენტი (140 random CSS particles)
- გამარჯვებულის/გამარჯვებულების სახელი
- საბოლოო ქულები

### `Confetti`
- 140 `<span>` elements, random color/position/delay
- CSS @keyframes `fall` (top → 110vh + rotation)

---

## `computeDerived(game)` — დეტალური ლოგიკა

**შედეგი (return object):**

| key | ტიპი | აღწერა |
|---|---|---|
| `baseByHand` | `number[][]` | ყველა ხელ×მოთამაშის base score |
| `exactByHand` | `boolean[][]` | exact hit flag |
| `premiumNoteByHand` | `string[]` | ბოლო ხელზე premium label |
| `handTotals` | `number[][]` | base + premium adjustments |
| `cumByHand` | `number[]` | max setCum at each hand (for table column) |
| `sets` | `{index, sum[], teamSum[]}[]` | per-set totals |
| `setCum` | `number[4]` | current set live cumulative |
| `grandTotals` | `number[4]` | total across all sets |
| `handsDone` | `number` | continuously-done hands from start |

**Premium/Deduct ლოგიკა (per set):**
- `winners` = players who were exact on **every** hand of the set
- Solo mode (`!pairsEnabled`):
  - 1 winner → +maxBase for winner, −maxBase for others
  - 2+ winners → +maxBase for each winner, no deduct
- Pairs mode:
  - Only if **both** teammates are winners
  - `both_add`: team members get +maxBase each
  - `opp_deduct`: opposing team members get −maxBase each
  - Both teams perfect → neutral

---

## State სქემა

### `game` object
```js
{
  id: string,           // uid()
  name: string,         // "სესია – <date>"
  createdAt: number,    // Date.now()
  config: {
    players: [string, string, string, string],
    whistPenalty: number,       // default: -900
    handsPerSet: number,        // default: 4
    totalSets: number,          // default: 4
    startDealerIndex: number,   // 0-3
    mode: "9s" | "sequence",
    passLimitEnabled: boolean,
    passLimitPerPlayer: number, // default: 4
    pairsEnabled: boolean,
    teamPremiumMode: "both_add" | "opp_deduct"
  },
  state: {
    bids: (number | "-" | null)[][],   // [totalHands][4]
    tooks: (number | null)[][],        // [totalHands][4]
    notes: string
  }
}
```

### localStorage
- `joker_user` → `{id, name, email}`
- `joker_games` → `game[]`

---

## CSS Classes (index.css custom)

| კლასი | სტილი |
|---|---|
| `.badge` | small rounded pill, bg-white/10 |
| `.teamtag` | indigo tinted badge |
| `.subtle` | 10px zinc-400 text |
| `.playername` | 12px medium zinc-200 |
| `.cellbox` | flex col gap-1 |
| `.sel` | full-width dark select/input |
| `.sidebar-sticky` | sticky top-[72px] |
| `.playername .nm` | truncate with responsive max-w |
| `.manual-width` | width: 100% |

---

## გეიმ-მოდები

### ცხრიანები (9s)
- ყველა ხელზე 9 ბარათი ირიგება
- სეტი = `handsPerSet` ხელი, `totalSets` სეტი
- Whist penalty კონფიგურირებადია (default -900)

### რიგითობით (sequence)
- ხელების ნომრები: 1,2,3,4,5,6,7,8,9,9,9,9,8,7,6,5,4,3,2,1,9,9,9,9 (24 ხელი)
- სეტების ზომები: [8, 4, 8, 4]
- Whist = −(handNumber × 100) ავტომატურად

---

## Deployment

- **GitHub Pages:** `vite.config.js` → `base: "/Joker-Game-Dashboard/"`
- **GitHub Actions** workflow in `.github/workflows/`
- `dist/` folder = built output
- Static hosting მხარდაჭერა: Netlify, Vercel, GitHub Pages

---

## განვითარების ბრძანებები

```bash
npm install       # dependencies
npm run dev       # dev server → http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview built version
```
