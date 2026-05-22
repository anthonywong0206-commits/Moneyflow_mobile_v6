import React, { useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, PlusCircle, CalendarDays, BarChart3, Settings, WalletCards, PiggyBank,
  Download, Share2, X, GripVertical, Trash2, Edit3, Save, RotateCcw, Palette,
  ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line,
  XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts'
import html2canvas from 'html2canvas'
import './styles.css'

const HKD = new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD', maximumFractionDigits: 1 })
const todayISO = () => new Date().toISOString().slice(0, 10)
const yesterdayISO = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

const themes = {
  pro: {
    name: '金融專業版',
    desc: '黑白灰、Apple Card、高級金融感',
    app: 'from-slate-100 via-white to-zinc-100',
    card: 'bg-white/78 border-slate-200/70',
    accent: 'from-slate-900 to-slate-600',
    soft: 'bg-slate-900 text-white',
    chip: 'bg-slate-100 text-slate-700',
    chart: ['#111827', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#0f766e'],
  },
  jp: {
    name: '日本文青版',
    desc: '米白、淺啡、手帳 / MUJI 氣質',
    app: 'from-stone-100 via-[#fffaf0] to-amber-50',
    card: 'bg-[#fffaf0]/82 border-amber-100',
    accent: 'from-amber-700 to-stone-500',
    soft: 'bg-amber-100 text-amber-900',
    chip: 'bg-stone-100 text-stone-700',
    chart: ['#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24', '#78716c'],
  },
  fairy: {
    name: '童話風',
    desc: '柔和 pastel、夢幻漸變、小插圖感',
    app: 'from-pink-50 via-sky-50 to-violet-50',
    card: 'bg-white/75 border-pink-100',
    accent: 'from-pink-400 to-sky-400',
    soft: 'bg-pink-100 text-pink-800',
    chip: 'bg-violet-100 text-violet-700',
    chart: ['#fb7185', '#a78bfa', '#60a5fa', '#34d399', '#facc15', '#f472b6'],
  },
  cat: {
    name: '貓貓可愛版',
    desc: '奶油色、paw icon、圓潤可愛 UI',
    app: 'from-orange-50 via-rose-50 to-yellow-50',
    card: 'bg-white/80 border-orange-100',
    accent: 'from-orange-300 to-rose-300',
    soft: 'bg-orange-100 text-orange-900',
    chip: 'bg-yellow-100 text-yellow-800',
    chart: ['#fb923c', '#f97316', '#f9a8d4', '#fde68a', '#84cc16', '#fca5a5'],
  },
  neon: {
    name: 'Cyber Neon',
    desc: '深色、霓虹、科技感',
    app: 'from-slate-950 via-indigo-950 to-black',
    card: 'bg-slate-900/72 border-cyan-400/20 text-slate-50',
    accent: 'from-cyan-400 to-fuchsia-500',
    soft: 'bg-cyan-400 text-slate-950',
    chip: 'bg-slate-800 text-cyan-100',
    chart: ['#22d3ee', '#e879f9', '#818cf8', '#34d399', '#facc15', '#fb7185'],
  },
}

const defaultPayments = [
  { id: 'cash', label: '現金', emoji: '💵' },
  { id: 'octopus', label: '八達通', emoji: '🟢' },
  { id: 'alipay', label: '支付寶', emoji: '🔵' },
  { id: 'card', label: '信用卡', emoji: '🟣' },
  { id: 'payme', label: 'PayMe', emoji: '🟠' },
  { id: 'fps', label: 'FPS', emoji: '⚪' },
]

const expenseCategories = [
  { id: 'breakfast', name: '早餐', emoji: '🍳' },
  { id: 'lunch', name: '午餐', emoji: '🍱' },
  { id: 'dinner', name: '晚餐', emoji: '🍜' },
  { id: 'transport', name: '交通', emoji: '🚌' },
  { id: 'shopping', name: '購物', emoji: '🛍' },
  { id: 'pet', name: '寵物', emoji: '🐶' },
  { id: 'misc', name: '雜項', emoji: '📦' },
]
const incomeCategories = ['薪金', '兼職', '津貼', '退款', '利息', '禮金', '其他收入']
const savingCategories = ['定期儲蓄', '投資戶口', '應急基金', '旅行基金', '寵物基金', '其他儲蓄']

const seedTransactions = () => {
  const now = new Date()
  const day = (n) => {
    const d = new Date(now)
    d.setDate(now.getDate() - n)
    return d.toISOString().slice(0, 10)
  }
  return [
    tx('expense', 55, '午餐', '🍱', '八達通', day(0), '午餐'),
    tx('expense', 12, '交通', '🚌', '八達通', day(0), 'MTR'),
    tx('saving', 500, '應急基金', '🐷', 'FPS', day(1), '每週儲蓄'),
    tx('income', 12000, '薪金', '💼', 'FPS', day(2), '薪金'),
    tx('expense', 88, '寵物', '🐶', '信用卡', day(3), '貓糧'),
    tx('expense', 70, '晚餐', '🍜', '支付寶', day(4), ''),
    tx('expense', 8.5, '交通', '🚌', '八達通', day(5), '巴士'),
  ]
}
const tx = (type, amount, category, emoji, payment, date, note='') => ({
  id: uid(), type, amount: Number(amount), category, emoji, payment, date,
  datetime: new Date(`${date}T${new Date().toTimeString().slice(0, 8)}`).toISOString(),
  note,
})

const defaultQuickKeys = [
  { id: uid(), emoji: '🍱', name: '午餐', amount: 55, category: '午餐', payment: '八達通', visible: true },
  { id: uid(), emoji: '🚇', name: 'MTR', amount: 12, category: '交通', payment: '八達通', visible: true },
  { id: uid(), emoji: '🚌', name: '巴士', amount: 8.5, category: '交通', payment: '八達通', visible: true },
  { id: uid(), emoji: '🚕', name: '的士', amount: 60, category: '交通', payment: '信用卡', visible: true },
  { id: uid(), emoji: '🐱', name: '貓糧', amount: 88, category: '寵物', payment: '信用卡', visible: true },
  { id: uid(), emoji: '🍜', name: '晚餐', amount: 70, category: '晚餐', payment: '支付寶', visible: true },
]

function useLocalState(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })
  const save = (next) => {
    const value = typeof next === 'function' ? next(state) : next
    setState(value)
    localStorage.setItem(key, JSON.stringify(value))
  }
  return [state, save]
}

function App() {
  const [page, setPage] = useLocalState('mf-page', 'home')
  const [themeId, setThemeId] = useLocalState('mf-theme', 'pro')
  const [transactions, setTransactions] = useLocalState('mf-transactions-v6', seedTransactions())
  const [quickKeys, setQuickKeys] = useLocalState('mf-quickkeys-v6', defaultQuickKeys)
  const [payment, setPayment] = useLocalState('mf-payment', '八達通')
  const [toast, setToast] = useState('')
  const [editor, setEditor] = useState(null)
  const [modal, setModal] = useState(null)
  const theme = themes[themeId] || themes.pro

  const notify = (msg) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 1800)
  }
  const addTransaction = (entry) => {
    const next = { ...entry, id: uid(), datetime: new Date(`${entry.date}T${new Date().toTimeString().slice(0, 8)}`).toISOString() }
    setTransactions([next, ...transactions])
    notify(`${entry.emoji || '✅'} 已新增 ${entry.category} ${HKD.format(entry.amount)}`)
  }
  const updateTransaction = (updated) => {
    setTransactions(transactions.map(t => t.id === updated.id ? updated : t))
    setEditor(null)
    notify('交易已更新')
  }
  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id))
    setEditor(null)
    notify('交易已刪除')
  }

  const shared = { page, setPage, theme, themeId, setThemeId, transactions, setTransactions, quickKeys, setQuickKeys, payment, setPayment, addTransaction, updateTransaction, deleteTransaction, setEditor, notify, setModal }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.app} transition-colors duration-500`}>
      <div className="mx-auto min-h-screen max-w-5xl px-3 pb-24 pt-4 sm:px-5">
        <AnimatePresence mode="wait">
          <motion.main key={page} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .22 }}>
            {page === 'home' && <HomePage {...shared} />}
            {page === 'quick' && <QuickAddPage {...shared} />}
            {page === 'calendar' && <CalendarPage {...shared} />}
            {page === 'stats' && <StatsPage {...shared} />}
            {page === 'settings' && <SettingsPage {...shared} />}
          </motion.main>
        </AnimatePresence>
      </div>
      <BottomNav page={page} setPage={setPage} theme={theme} />
      <AnimatePresence>{toast && <Toast text={toast} />}</AnimatePresence>
      <AnimatePresence>{editor && <TransactionEditor item={editor} payments={defaultPayments} onClose={() => setEditor(null)} onSave={updateTransaction} onDelete={deleteTransaction} theme={theme} />}</AnimatePresence>
      <AnimatePresence>{modal && <EntryModal mode={modal} theme={theme} payment={payment} setPayment={setPayment} onClose={() => setModal(null)} onAdd={(entry)=>{addTransaction(entry); setModal(null)}} />}</AnimatePresence>
    </div>
  )
}

function SectionTitle({ children, sub }) {
  return <div className="mb-3"><h2 className="text-lg font-bold text-slate-900 dark:text-white">{children}</h2>{sub && <p className="text-sm text-slate-500">{sub}</p>}</div>
}
function Glass({ theme, className='', children, id }) {
  return <div id={id} className={`rounded-[2rem] border ${theme.card} p-4 shadow-soft backdrop-blur-2xl ${className}`}>{children}</div>
}
function summaries(transactions) {
  const ym = new Date().toISOString().slice(0,7)
  const month = transactions.filter(t => t.date?.startsWith(ym))
  const sum = type => month.filter(t => t.type===type).reduce((a,b)=>a+Number(b.amount||0),0)
  const expense = sum('expense')
  const income = sum('income')
  const saving = sum('saving')
  const today = month.filter(t=>t.date===todayISO() && t.type==='expense').reduce((a,b)=>a+b.amount,0)
  const balance = income - expense - saving
  const savingRate = income ? Math.round((saving / income) * 100) : 0
  return { expense, income, saving, today, balance, savingRate, month }
}

function HomePage(props) {
  const { transactions, quickKeys, addTransaction, setEditor, theme, setPage, setModal } = props
  const s = summaries(transactions)
  const visibleKeys = quickKeys.filter(k=>k.visible).slice(0,8)

  const quickAdd = (k) => addTransaction(tx('expense', k.amount, k.category, k.emoji, k.payment, todayISO(), k.name))

  return <div className="space-y-4">
    <header className="flex items-center justify-between pt-2">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">MoneyFlow</h1>
        <p className="text-sm text-slate-500">清楚記錄每一天的金錢流向。</p>
      </div>
      <button onClick={()=>setPage('settings')} className={`rounded-2xl px-3 py-2 text-sm font-semibold ${theme.chip}`}>Theme</button>
    </header>

    <Glass theme={theme} className={`overflow-hidden bg-gradient-to-br ${theme.accent} text-white`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-80">本月結餘</p>
          <h2 className="mt-1 text-4xl font-black">{HKD.format(s.balance)}</h2>
        </div>
        <WalletCards className="opacity-80" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2 text-sm">
        <MiniStat label="支出" value={HKD.format(s.expense)} />
        <MiniStat label="收入" value={HKD.format(s.income)} />
        <MiniStat label="儲蓄" value={HKD.format(s.saving)} />
        <MiniStat label="今日" value={HKD.format(s.today)} />
        <MiniStat label="儲蓄率" value={`${s.savingRate}%`} />
        <MiniStat label="紀錄" value={`${s.month.length} 筆`} />
      </div>
    </Glass>

    <div className="grid grid-cols-3 gap-2">
      <button onClick={()=>setPage('quick')} className="quickAction bg-slate-900 text-white"><PlusCircle size={18}/>記帳</button>
      <button onClick={()=>setModal('income')} className="quickAction bg-gradient-to-r from-emerald-400 to-teal-500 text-white"><WalletCards size={18}/>收入</button>
      <button onClick={()=>setModal('saving')} className="quickAction bg-gradient-to-r from-indigo-400 to-violet-500 text-white"><PiggyBank size={18}/>儲蓄</button>
    </div>

    <Glass theme={theme}>
      <SectionTitle sub="最多 8 個，可在 Settings 管理">最近常用快捷交易</SectionTitle>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {visibleKeys.map(k => <button key={k.id} onClick={()=>quickAdd(k)} className="rounded-3xl bg-white/70 p-3 text-left shadow-sm ring-1 ring-slate-200/70 transition active:scale-95">
          <div className="text-2xl">{k.emoji}</div>
          <div className="mt-1 font-bold">{k.name}</div>
          <div className="text-sm text-slate-500">{HKD.format(k.amount)} · {k.payment}</div>
        </button>)}
      </div>
    </Glass>

    <Timeline transactions={transactions} setEditor={setEditor} theme={theme} />
  </div>
}

function MiniStat({label, value}) {
  return <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
    <p className="text-xs opacity-75">{label}</p>
    <p className="mt-1 truncate font-bold">{value}</p>
  </div>
}

function Timeline({ transactions, setEditor, theme }) {
  return <Glass theme={theme}>
    <SectionTitle sub="點擊可補充描述、日期及付款方式">Timeline</SectionTitle>
    <div className="space-y-2">
      {transactions.length === 0 && <Empty text="未有交易，試試 Quick Add。" />}
      {transactions.slice(0, 20).map(t => <button key={t.id} onClick={()=>setEditor(t)} className="flex w-full items-center gap-3 rounded-3xl bg-white/70 p-3 text-left shadow-sm ring-1 ring-slate-100 transition hover:bg-white active:scale-[.99]">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-2xl">{t.emoji || (t.type==='income'?'💰':t.type==='saving'?'🐷':'💸')}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-bold">{t.note || t.category}</p>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${t.type==='income'?'bg-emerald-100 text-emerald-700':t.type==='saving'?'bg-indigo-100 text-indigo-700':'bg-rose-100 text-rose-700'}`}>{typeLabel(t.type)}</span>
          </div>
          <p className="text-xs text-slate-500">{t.date} · {t.payment} · {t.note ? '已補充描述' : '可稍後補充描述'}</p>
        </div>
        <p className={`font-black ${t.type==='expense'?'text-rose-600':'text-emerald-600'}`}>{t.type==='expense'?'-':'+'}{HKD.format(t.amount)}</p>
      </button>)}
    </div>
  </Glass>
}
function typeLabel(t){ return t==='income'?'收入':t==='saving'?'儲蓄':'支出' }

function QuickAddPage(props) {
  const { theme, payment, setPayment, addTransaction, quickKeys } = props
  const [amount, setAmount] = useState('0')
  const [date, setDate] = useState(todayISO())
  const [customOpen, setCustomOpen] = useState(false)

  const press = (v) => {
    if (v === 'del') return setAmount(a => a.length > 1 ? a.slice(0,-1) : '0')
    if (v === 'clear') return setAmount('0')
    if (v === '.' && amount.includes('.')) return
    setAmount(a => a === '0' && v !== '.' ? v : a + v)
  }
  const submitExpense = (cat) => {
    const n = Number(amount)
    if (!n) return
    addTransaction(tx('expense', n, cat.name, cat.emoji, payment, date, ''))
    setAmount('0')
  }
  const quickAdd = (k) => {
    addTransaction(tx('expense', k.amount, k.category, k.emoji, k.payment, date, k.name))
  }
  return <div className="space-y-4">
    <Header title="Quick Add" subtitle="一屏完成，少打字多生活。" />
    <Glass theme={theme} className="min-h-[calc(100vh-170px)]">
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(118px,.75fr)] gap-3">
        <div className="space-y-3">
          <div className={`rounded-[2rem] bg-gradient-to-br ${theme.accent} p-4 text-white shadow-glow`}>
            <p className="text-sm opacity-80">輸入金額</p>
            <div className="mt-1 truncate text-4xl font-black">{HKD.format(Number(amount || 0))}</div>
          </div>
          <DateSelector date={date} setDate={setDate} customOpen={customOpen} setCustomOpen={setCustomOpen} theme={theme} />
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {defaultPayments.map(p => <button key={p.id} onClick={()=>setPayment(p.label)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${payment===p.label ? theme.soft : theme.chip}`}>{p.emoji} {p.label}</button>)}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['1','2','3','4','5','6','7','8','9','.','0','del'].map(v=><button key={v} onClick={()=>press(v)} className="keyBtn">{v==='del'?'⌫':v}</button>)}
          </div>
          <button onClick={()=>press('clear')} className="w-full rounded-2xl bg-slate-100 py-2 text-sm font-bold text-slate-600">清除</button>
        </div>
        <div className="grid gap-2">
          {expenseCategories.map(c => <button key={c.id} onClick={()=>submitExpense(c)} className="rounded-3xl bg-white/80 p-2 text-center shadow-sm ring-1 ring-slate-200 active:scale-95">
            <div className="text-2xl">{c.emoji}</div><div className="text-xs font-bold">{c.name}</div>
          </button>)}
        </div>
      </div>
    </Glass>

    <Glass theme={theme}>
      <SectionTitle sub="使用目前選擇日期新增">快捷交易</SectionTitle>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {quickKeys.filter(k=>k.visible).slice(0,8).map(k=><button key={k.id} onClick={()=>quickAdd(k)} className="shrink-0 rounded-3xl bg-white/80 p-3 text-left shadow-sm ring-1 ring-slate-200 active:scale-95">
          <div className="text-xl">{k.emoji}</div><div className="font-bold">{k.name}</div><div className="text-xs text-slate-500">{HKD.format(k.amount)}</div>
        </button>)}
      </div>
    </Glass>
  </div>
}

function DateSelector({date, setDate, customOpen, setCustomOpen, theme}) {
  return <div className="rounded-3xl bg-white/60 p-2 ring-1 ring-slate-200">
    <div className="grid grid-cols-3 gap-2">
      <button onClick={()=>{setDate(todayISO()); setCustomOpen(false)}} className={`dateBtn ${date===todayISO() ? 'activeDate' : ''}`}>今天</button>
      <button onClick={()=>{setDate(yesterdayISO()); setCustomOpen(false)}} className={`dateBtn ${date===yesterdayISO() ? 'activeDate' : ''}`}>昨天</button>
      <button onClick={()=>setCustomOpen(v=>!v)} className={`dateBtn ${customOpen ? 'activeDate' : ''}`}>自訂日期</button>
    </div>
    {customOpen && <div className="mt-2 rounded-2xl bg-white p-2 shadow-inner">
      <input aria-label="自訂日期" type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" />
      <p className="mt-1 text-xs text-slate-500">已選日期：{date}</p>
    </div>}
  </div>
}

function EntryModal({ mode, theme, payment, setPayment, onClose, onAdd }) {
  const isIncome = mode === 'income'
  const cats = isIncome ? incomeCategories : savingCategories
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(cats[0])
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [customOpen, setCustomOpen] = useState(false)
  const submit = () => {
    const n = Number(amount)
    if (!n) return
    onAdd(tx(mode, n, category, isIncome ? '💰' : '🐷', payment, date, note))
  }
  return <BottomSheet onClose={onClose} theme={theme} title={isIncome ? '新增收入' : '新增儲蓄'}>
    <div className="space-y-3">
      <input autoFocus inputMode="decimal" placeholder="金額" value={amount} onChange={e=>setAmount(e.target.value)} className="field text-3xl font-black" />
      <div className="grid grid-cols-2 gap-2">
        {cats.map(c=><button key={c} onClick={()=>setCategory(c)} className={`rounded-2xl px-3 py-3 text-sm font-bold ${category===c?theme.soft:theme.chip}`}>{c}</button>)}
      </div>
      <DateSelector date={date} setDate={setDate} customOpen={customOpen} setCustomOpen={setCustomOpen} theme={theme}/>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {defaultPayments.map(p => <button key={p.id} onClick={()=>setPayment(p.label)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${payment===p.label ? theme.soft : theme.chip}`}>{p.emoji} {p.label}</button>)}
      </div>
      <input placeholder="備註，可留空" value={note} onChange={e=>setNote(e.target.value)} className="field" />
      <button onClick={submit} className={`w-full rounded-3xl bg-gradient-to-r ${theme.accent} py-4 font-black text-white shadow-glow`}>儲存</button>
    </div>
  </BottomSheet>
}

function CalendarPage({ transactions, setEditor, theme }) {
  const [month, setMonth] = useState(new Date())
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  const days = Array.from({length: 42}, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate()+i)
    return d
  })
  const ym = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}`
  const move = (n) => setMonth(new Date(month.getFullYear(), month.getMonth()+n, 1))
  const dayTx = (iso) => transactions.filter(t=>t.date===iso)
  const [selected, setSelected] = useState(null)

  return <div className="space-y-4">
    <Header title="Calendar" subtitle="極簡日曆，只保留日曆與日期交易。" />
    <Glass theme={theme} className="min-h-[calc(100vh-170px)]">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={()=>move(-1)} className="iconBtn"><ChevronLeft/></button>
        <h2 className="text-xl font-black">{month.getFullYear()} 年 {month.getMonth()+1} 月</h2>
        <button onClick={()=>move(1)} className="iconBtn"><ChevronRight/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500">
        {['日','一','二','三','四','五','六'].map(d=><div key={d}>{d}</div>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map(d => {
          const iso = d.toISOString().slice(0,10)
          const list = dayTx(iso)
          const inMonth = iso.startsWith(ym)
          const expense = list.filter(t=>t.type==='expense').reduce((a,b)=>a+b.amount,0)
          const income = list.filter(t=>t.type==='income').reduce((a,b)=>a+b.amount,0)
          const saving = list.filter(t=>t.type==='saving').reduce((a,b)=>a+b.amount,0)
          return <button key={iso} onClick={()=>setSelected({iso, list})} className={`min-h-[72px] rounded-2xl p-1 text-left ring-1 transition active:scale-95 ${inMonth?'bg-white/70 ring-slate-200':'bg-white/30 text-slate-300 ring-transparent'} ${iso===todayISO()?'outline outline-2 outline-sky-300':''}`}>
            <span className="text-xs font-black">{d.getDate()}</span>
            {expense>0 && <div className="mt-1 truncate rounded bg-rose-100 px-1 text-[10px] font-bold text-rose-700">-{Math.round(expense)}</div>}
            {income>0 && <div className="mt-1 truncate rounded bg-emerald-100 px-1 text-[10px] font-bold text-emerald-700">+{Math.round(income)}</div>}
            {saving>0 && <div className="mt-1 truncate rounded bg-indigo-100 px-1 text-[10px] font-bold text-indigo-700">🐷 {Math.round(saving)}</div>}
          </button>
        })}
      </div>
    </Glass>
    <AnimatePresence>{selected && <BottomSheet onClose={()=>setSelected(null)} theme={theme} title={`${selected.iso} 交易`}>
      <div className="space-y-2">
        {selected.list.length===0 && <Empty text="這天未有交易。" />}
        {selected.list.map(t=><button key={t.id} onClick={()=>{setEditor(t); setSelected(null)}} className="flex w-full items-center justify-between rounded-2xl bg-white/80 p-3 text-left ring-1 ring-slate-200">
          <span>{t.emoji} {t.note || t.category}</span><b>{HKD.format(t.amount)}</b>
        </button>)}
      </div>
    </BottomSheet>}</AnimatePresence>
  </div>
}

function StatsPage({ transactions, theme }) {
  const exportRefs = useRef({})
  const s = summaries(transactions)
  const colors = theme.chart
  const catData = aggregate(transactions.filter(t=>t.type==='expense'), 'category')
  const payData = aggregate(transactions, 'payment')
  const daily = dailyData(transactions)
  const saving = dailySaving(transactions)

  const chartCard = (id, title, children) => <Glass theme={theme} className="relative" id={`chart-${id}`}>
    <div className="mb-3 flex items-center justify-between">
      <div><h3 className="font-black">{title}</h3><p className="text-xs text-slate-500">{new Date().toISOString().slice(0,7)}</p></div>
      <div className="flex gap-1">
        <button className="iconBtn small" onClick={()=>downloadElement(`chart-${id}`, `${title}.png`)}><Download size={16}/></button>
        <button className="iconBtn small" onClick={()=>shareElement(`chart-${id}`, `${title}.png`)}><Share2 size={16}/></button>
      </div>
    </div>
    {children}
  </Glass>

  return <div className="space-y-4">
    <Header title="Stats" subtitle="每張圖表都可以下載或分享。" />
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <StatCard theme={theme} label="支出" value={HKD.format(s.expense)} />
      <StatCard theme={theme} label="收入" value={HKD.format(s.income)} />
      <StatCard theme={theme} label="儲蓄" value={HKD.format(s.saving)} />
      <StatCard theme={theme} label="儲蓄率" value={`${s.savingRate}%`} />
    </div>

    {chartCard('pie', '類別開支比例',
      <div className="h-72">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={catData} dataKey="value" nameKey="name" outerRadius={82} labelLine label={({name, percent, value}) => `${name} ${(percent*100).toFixed(0)}% ${Math.round(value)}`}>
              {catData.map((_, i)=><Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip formatter={(v)=>HKD.format(v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )}

    {chartCard('line', '每日消費變化',
      <div className="h-64"><ResponsiveContainer><LineChart data={daily}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis/><Tooltip formatter={(v)=>HKD.format(v)}/><Line type="monotone" dataKey="expense" stroke={colors[0]} strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></div>
    )}

    {chartCard('bar', '收入 / 支出 / 儲蓄',
      <div className="h-64"><ResponsiveContainer><BarChart data={daily}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis/><Tooltip formatter={(v)=>HKD.format(v)}/><Bar dataKey="income" fill={colors[3]}/><Bar dataKey="expense" fill={colors[0]}/><Bar dataKey="saving" fill={colors[2]}/></BarChart></ResponsiveContainer></div>
    )}

    {chartCard('payment', '支付方式比例',
      <div className="h-64"><ResponsiveContainer><PieChart><Pie data={payData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82} label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}>{payData.map((_,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip formatter={(v)=>HKD.format(v)}/></PieChart></ResponsiveContainer></div>
    )}

    {chartCard('saving', 'Saving Trend',
      <div className="h-64"><ResponsiveContainer><LineChart data={saving}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis/><Tooltip formatter={(v)=>HKD.format(v)}/><Line type="monotone" dataKey="saving" stroke={colors[2]} strokeWidth={3}/></LineChart></ResponsiveContainer></div>
    )}
  </div>
}

function aggregate(list, key) {
  const map = {}
  list.forEach(t => map[t[key] || '其他'] = (map[t[key] || '其他'] || 0) + Number(t.amount || 0))
  return Object.entries(map).map(([name, value])=>({name, value})).filter(d=>d.value>0)
}
function dailyData(transactions) {
  const days = []
  for (let i=13;i>=0;i--) {
    const d = new Date(); d.setDate(d.getDate()-i)
    const iso = d.toISOString().slice(5,10)
    const full = d.toISOString().slice(0,10)
    days.push({
      date: iso,
      expense: transactions.filter(t=>t.date===full && t.type==='expense').reduce((a,b)=>a+b.amount,0),
      income: transactions.filter(t=>t.date===full && t.type==='income').reduce((a,b)=>a+b.amount,0),
      saving: transactions.filter(t=>t.date===full && t.type==='saving').reduce((a,b)=>a+b.amount,0),
    })
  }
  return days
}
function dailySaving(transactions){ return dailyData(transactions).map(d=>({date:d.date, saving:d.saving})) }

function StatCard({theme, label, value}) {
  return <div className={`rounded-3xl border ${theme.card} p-4 shadow-soft backdrop-blur`}>
    <p className="text-xs text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-black">{value}</p>
  </div>
}

async function downloadElement(id, filename) {
  const el = document.getElementById(id)
  if (!el) return
  const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 })
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}
async function shareElement(id, filename) {
  const el = document.getElementById(id)
  if (!el) return
  const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 })
  canvas.toBlob(async blob => {
    const file = new File([blob], filename, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: 'MoneyFlow', text: '我的 MoneyFlow 圖卡', files: [file] })
    } else {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      alert('已下載圖片。可手動上傳至 IG Story 或 WhatsApp。')
    }
  })
}

function SettingsPage({ theme, themeId, setThemeId, quickKeys, setQuickKeys, transactions, setTransactions, notify }) {
  const [draft, setDraft] = useState({ emoji:'☕', name:'Coffee', amount:38, category:'雜項', payment:'八達通', visible:true })
  const fileRef = useRef(null)
  const addKey = () => {
    if (!draft.name || !Number(draft.amount)) return
    setQuickKeys([...quickKeys, { ...draft, id: uid(), amount: Number(draft.amount) }])
    setDraft({ emoji:'☕', name:'Coffee', amount:38, category:'雜項', payment:'八達通', visible:true })
    notify('快捷鍵已新增')
  }
  const updateKey = (id, patch) => setQuickKeys(quickKeys.map(k=>k.id===id?{...k,...patch}:k))
  const removeKey = (id) => setQuickKeys(quickKeys.filter(k=>k.id!==id))
  const moveKey = (idx, dir) => {
    const arr = [...quickKeys]
    const ni = idx + dir
    if (ni < 0 || ni >= arr.length) return
    const [item] = arr.splice(idx,1)
    arr.splice(ni,0,item)
    setQuickKeys(arr)
  }
  const resetDemo = () => {
    if (!confirm('確定要重設所有資料嗎？')) return
    if (!confirm('此操作無法還原，確定刪除？')) return
    localStorage.clear()
    location.reload()
  }
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({transactions, quickKeys}, null, 2)], {type:'application/json'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'moneyflow-backup.json'
    a.click()
  }
  const exportCsv = () => {
    const rows = [['type','amount','category','payment','date','note'], ...transactions.map(t=>[t.type,t.amount,t.category,t.payment,t.date,t.note])]
    const csv = rows.map(r=>r.map(x=>`"${String(x??'').replaceAll('"','""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], {type:'text/csv'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'moneyflow.csv'
    a.click()
  }

  return <div className="space-y-4">
    <Header title="Settings" subtitle="Theme Studio、快捷鍵、備份與重設。" />

    <Glass theme={theme}>
      <SectionTitle sub="每種風格會改變配色、卡片、Bottom Nav 與圖表色彩">Theme Studio</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(themes).map(([id,t])=><button key={id} onClick={()=>setThemeId(id)} className={`rounded-3xl border p-4 text-left shadow-sm ${themeId===id?'border-sky-400 bg-sky-50':'border-slate-200 bg-white/70'}`}>
          <div className={`mb-2 h-10 rounded-2xl bg-gradient-to-r ${t.accent}`}></div>
          <div className="font-black">{t.name}</div>
          <div className="text-xs text-slate-500">{t.desc}</div>
        </button>)}
      </div>
    </Glass>

    <Glass theme={theme}>
      <SectionTitle sub="最多顯示 8 個；可排序、隱藏、新增、刪除。">自訂常用快捷鍵</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-5">
        <input className="field" value={draft.emoji} onChange={e=>setDraft({...draft, emoji:e.target.value})} placeholder="Emoji" />
        <input className="field sm:col-span-2" value={draft.name} onChange={e=>setDraft({...draft, name:e.target.value})} placeholder="名稱" />
        <input className="field" value={draft.amount} onChange={e=>setDraft({...draft, amount:e.target.value})} placeholder="金額" inputMode="decimal" />
        <button onClick={addKey} className={`rounded-2xl bg-gradient-to-r ${theme.accent} px-4 py-3 font-black text-white`}>新增</button>
      </div>
      <div className="mt-3 space-y-2">
        {quickKeys.map((k, idx)=><div key={k.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-2 rounded-3xl bg-white/70 p-2 ring-1 ring-slate-200">
          <GripVertical className="text-slate-400" size={18}/>
          <div>
            <b>{k.emoji} {k.name}</b>
            <p className="text-xs text-slate-500">{HKD.format(k.amount)} · {k.category} · {k.payment}</p>
          </div>
          <button className="text-xs font-bold" onClick={()=>updateKey(k.id, { visible: !k.visible })}>{k.visible?'顯示':'隱藏'}</button>
          <div className="flex gap-1">
            <button className="miniBtn" onClick={()=>moveKey(idx,-1)}>↑</button>
            <button className="miniBtn" onClick={()=>moveKey(idx,1)}>↓</button>
          </div>
          <button className="miniBtn text-rose-500" onClick={()=>removeKey(k.id)}><Trash2 size={16}/></button>
        </div>)}
      </div>
    </Glass>

    <Glass theme={theme}>
      <SectionTitle>資料管理</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={exportCsv} className="settingBtn"><Download size={18}/>匯出 CSV</button>
        <button onClick={exportJson} className="settingBtn"><Save size={18}/>匯出 JSON</button>
        <button onClick={()=>fileRef.current?.click()} className="settingBtn"><Edit3 size={18}/>匯入 JSON</button>
        <button onClick={resetDemo} className="settingBtn danger"><RotateCcw size={18}/>Demo Reset</button>
      </div>
      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={async e=>{
        const f=e.target.files?.[0]; if(!f) return
        const data=JSON.parse(await f.text())
        if(data.transactions) setTransactions(data.transactions)
        if(data.quickKeys) setQuickKeys(data.quickKeys)
        notify('已匯入備份')
      }}/>
    </Glass>
  </div>
}

function TransactionEditor({ item, payments, onClose, onSave, onDelete, theme }) {
  const [draft, setDraft] = useState(item)
  const [customOpen, setCustomOpen] = useState(false)
  return <BottomSheet onClose={onClose} theme={theme} title="編輯交易">
    <div className="space-y-3">
      <input className="field" value={draft.note || ''} onChange={e=>setDraft({...draft, note:e.target.value})} placeholder="消費名稱 / 描述" />
      <input className="field" value={draft.amount} onChange={e=>setDraft({...draft, amount:Number(e.target.value)})} inputMode="decimal" />
      <input className="field" value={draft.category} onChange={e=>setDraft({...draft, category:e.target.value})} />
      <DateSelector date={draft.date} setDate={(date)=>setDraft({...draft,date})} customOpen={customOpen} setCustomOpen={setCustomOpen} theme={theme} />
      <select className="field" value={draft.type} onChange={e=>setDraft({...draft, type:e.target.value})}>
        <option value="expense">支出</option><option value="income">收入</option><option value="saving">儲蓄</option>
      </select>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {payments.map(p=><button key={p.id} onClick={()=>setDraft({...draft, payment:p.label})} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${draft.payment===p.label ? theme.soft : theme.chip}`}>{p.emoji} {p.label}</button>)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={()=>onSave(draft)} className={`rounded-3xl bg-gradient-to-r ${theme.accent} py-3 font-black text-white`}>儲存</button>
        <button onClick={()=>onDelete(draft.id)} className="rounded-3xl bg-rose-100 py-3 font-black text-rose-700">刪除</button>
      </div>
    </div>
  </BottomSheet>
}

function BottomSheet({ children, onClose, title, theme }) {
  return <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 p-2 backdrop-blur-sm" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <motion.div initial={{y:260}} animate={{y:0}} exit={{y:260}} transition={{type:'spring', damping:24, stiffness:260}} className={`max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border ${theme.card} p-4 shadow-2xl backdrop-blur-2xl`}>
      <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-black">{title}</h3><button onClick={onClose} className="iconBtn"><X/></button></div>
      {children}
    </motion.div>
  </motion.div>
}

function Header({title, subtitle}) {
  return <header className="pt-2"><h1 className="text-3xl font-black tracking-tight text-slate-950">{title}</h1><p className="text-sm text-slate-500">{subtitle}</p></header>
}
function Empty({text}) { return <div className="rounded-3xl bg-white/60 p-8 text-center text-sm text-slate-500">☁️<br/>{text}</div> }
function Toast({text}) {
  return <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}} className="fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl">
    <CheckCircle2 size={18}/>{text}
  </motion.div>
}
function BottomNav({ page, setPage, theme }) {
  const items = [
    ['home', Home, 'Home'],
    ['quick', PlusCircle, 'Quick'],
    ['calendar', CalendarDays, 'Calendar'],
    ['stats', BarChart3, 'Stats'],
    ['settings', Settings, 'Settings'],
  ]
  return <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-xl p-3">
    <div className={`grid grid-cols-5 rounded-[2rem] border ${theme.card} p-2 shadow-2xl backdrop-blur-2xl`}>
      {items.map(([id, Icon, label])=><button key={id} onClick={()=>setPage(id)} className={`flex flex-col items-center gap-1 rounded-3xl px-2 py-2 text-[11px] font-bold transition ${page===id?theme.soft:'text-slate-500'}`}>
        <Icon size={19}/>{label}
      </button>)}
    </div>
  </nav>
}

createRoot(document.getElementById('root')).render(<App />)
