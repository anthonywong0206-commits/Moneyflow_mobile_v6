import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import {
  Home, PlusCircle, CalendarDays, BarChart3, Settings, WalletCards, PiggyBank,
  Download, Share2, X, Trash2, GripVertical, ChevronLeft, ChevronRight,
  CheckCircle2, Palette, Save, Upload
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line,
  XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts'
import './styles.css'

const money = new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD', maximumFractionDigits: 1 })
const todayISO = () => new Date().toISOString().slice(0, 10)
const yesterdayISO = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
const API_BASE = (import.meta.env.VITE_MONEYFLOW_API_URL || 'https://api.pigpocket.org').replace(/\/$/, '')

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API ${response.status}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

function readStoredArray(key) {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function txTime(tx) {
  return Date.parse(tx?.updatedAt || tx?.createdAt || tx?.datetime || tx?.date || '') || 0
}

function mergeTransactions(localTransactions, remoteTransactions) {
  const byId = new Map()

  remoteTransactions.forEach((tx) => {
    if (tx?.id) byId.set(tx.id, tx)
  })
  localTransactions.forEach((tx) => {
    if (tx?.id) byId.set(tx.id, { ...byId.get(tx.id), ...tx })
  })

  return Array.from(byId.values()).sort((a, b) => txTime(b) - txTime(a))
}

const themes = {
  pro: { name:'金融專業版', desc:'黑白灰、Apple Card、高級金融感', bg:'theme-pro', accent:'from-slate-950 to-slate-600', card:'glass-card', chip:'chip-pro', colors:['#111827','#475569','#64748b','#94a3b8','#0f766e','#0284c7'] },
  jp: { name:'日本文青版', desc:'米白、淺啡、手帳 / MUJI 感', bg:'theme-jp', accent:'from-amber-700 to-stone-500', card:'glass-card warm', chip:'chip-warm', colors:['#92400e','#b45309','#d97706','#f59e0b','#78716c','#a16207'] },
  fairy: { name:'童話風', desc:'柔和 pastel、夢幻漸變', bg:'theme-fairy', accent:'from-pink-400 to-sky-400', card:'glass-card', chip:'chip-fairy', colors:['#fb7185','#a78bfa','#60a5fa','#34d399','#facc15','#f472b6'] },
  cat: { name:'貓貓可愛版', desc:'奶油色、圓潤 UI、可愛感', bg:'theme-cat', accent:'from-orange-300 to-rose-300', card:'glass-card warm', chip:'chip-cat', colors:['#fb923c','#f97316','#f9a8d4','#fde68a','#84cc16','#fca5a5'] },
  neon: { name:'Cyber Neon', desc:'深色、霓虹、科技感', bg:'theme-neon', accent:'from-cyan-400 to-fuchsia-500', card:'glass-card dark', chip:'chip-neon', colors:['#22d3ee','#e879f9','#818cf8','#34d399','#facc15','#fb7185'] },
}

const expenseCategories = [
  { name:'早餐', emoji:'🍳' }, { name:'午餐', emoji:'🍱' }, { name:'晚餐', emoji:'🍜' },
  { name:'交通', emoji:'🚌' }, { name:'購物', emoji:'🛍' }, { name:'寵物', emoji:'🐶' }, { name:'雜項', emoji:'📦' }
]
const paymentMethods = ['現金','八達通','支付寶','信用卡','PayMe','FPS']
const incomeCategories = ['薪金','兼職','津貼','退款','利息','禮金','其他收入']
const savingCategories = ['定期儲蓄','投資戶口','應急基金','旅行基金','寵物基金','其他儲蓄']

function makeTx(type, amount, category, emoji, payment, date, note='') {
  return { id:uid(), type, amount:Number(amount), category, emoji, payment, date, note, createdAt:new Date().toISOString() }
}
function seedTransactions() {
  const d = (minus) => { const x = new Date(); x.setDate(x.getDate() - minus); return x.toISOString().slice(0,10) }
  return [
    makeTx('expense',55,'午餐','🍱','八達通',d(0),'午餐'),
    makeTx('expense',12,'交通','🚌','八達通',d(0),'MTR'),
    makeTx('saving',500,'應急基金','🐷','FPS',d(1),'每週儲蓄'),
    makeTx('income',12000,'薪金','💰','FPS',d(2),'薪金'),
    makeTx('expense',88,'寵物','🐶','信用卡',d(3),'貓糧'),
    makeTx('expense',70,'晚餐','🍜','支付寶',d(4),'晚餐'),
    makeTx('expense',8.5,'交通','🚌','八達通',d(5),'巴士'),
    makeTx('expense',120,'購物','🛍','信用卡',d(6),'生活用品')
  ]
}
const seedKeys = [
  { id:uid(), emoji:'🍱', name:'午餐', amount:55, category:'午餐', payment:'八達通', visible:true },
  { id:uid(), emoji:'🚇', name:'MTR', amount:12, category:'交通', payment:'八達通', visible:true },
  { id:uid(), emoji:'🚌', name:'巴士', amount:8.5, category:'交通', payment:'八達通', visible:true },
  { id:uid(), emoji:'🚕', name:'的士', amount:60, category:'交通', payment:'信用卡', visible:true },
  { id:uid(), emoji:'🐱', name:'貓糧', amount:88, category:'寵物', payment:'信用卡', visible:true },
  { id:uid(), emoji:'🍜', name:'晚餐', amount:70, category:'晚餐', payment:'支付寶', visible:true },
]

function useLocal(key, initial) {
  const [value, setValue] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial } catch { return initial }
  })
  const save = (next) => {
    const val = typeof next === 'function' ? next(value) : next
    setValue(val)
    localStorage.setItem(key, JSON.stringify(val))
  }
  return [value, save]
}

function App() {
  const [page, setPage] = useLocal('mfv71-page','home')
  const [transactions, setTransactions] = useLocal('mfv71-transactions', seedTransactions())
  const [quickKeys, setQuickKeys] = useLocal('mfv71-quickkeys', seedKeys)
  const [themeId, setThemeId] = useLocal('mfv71-theme','pro')
  const [payment, setPayment] = useLocal('mfv71-payment','八達通')
  const [toast, setToast] = useState('')
  const [editor, setEditor] = useState(null)
  const [entryMode, setEntryMode] = useState(null)
  const theme = themes[themeId] || themes.pro

  useEffect(() => {
    let cancelled = false
    const localTransactions = readStoredArray('mfv71-transactions')

    apiRequest('/transactions')
      .then((remoteTransactions) => {
        if (!cancelled && Array.isArray(remoteTransactions)) {
          const remoteIds = new Set(remoteTransactions.map((tx) => tx?.id).filter(Boolean))
          const missingFromNas = localTransactions.filter((tx) => tx?.id && !remoteIds.has(tx.id))
          const mergedTransactions = mergeTransactions(localTransactions, remoteTransactions)

          setTransactions(mergedTransactions)

          if (missingFromNas.length) {
            Promise.allSettled(
              missingFromNas.map((tx) =>
                apiRequest('/transactions', {
                  method: 'POST',
                  body: JSON.stringify(tx),
                })
              )
            )
            notify(`已合併 ${missingFromNas.length} 筆本機資料到 NAS`)
          } else {
            notify('已連接 NAS')
          }
        }
      })
      .catch(() => {
        if (!cancelled) notify('NAS 暫時連不到，使用本機資料')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const notify = (message) => {
    setToast(message)
    setTimeout(()=>setToast(''), 1700)
  }
  const addTransaction = (tx) => {
    setTransactions([tx, ...transactions])
    apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(tx),
    }).catch(() => notify('已存本機，NAS 同步失敗'))
    notify(`${tx.emoji || '✅'} 已新增 ${tx.category} ${money.format(tx.amount)}`)
  }
  const updateTransaction = (tx) => {
    setTransactions(transactions.map(t => t.id === tx.id ? tx : t))
    setEditor(null)
    notify('已更新交易')
  }
  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id))
    setEditor(null)
    notify('已刪除交易')
  }
  const props = { transactions, setTransactions, quickKeys, setQuickKeys, theme, themeId, setThemeId, payment, setPayment, addTransaction, setEditor, setPage, notify, setEntryMode }

  return <div className={`app-shell ${theme.bg}`}>
    <div className="app-content">
      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.2}}>
          {page === 'home' && <HomePage {...props} />}
          {page === 'quick' && <QuickAddPage {...props} />}
          {page === 'calendar' && <CalendarPage {...props} />}
          {page === 'stats' && <StatsPage {...props} />}
          {page === 'settings' && <SettingsPage {...props} />}
        </motion.div>
      </AnimatePresence>
    </div>
    <BottomNav page={page} setPage={setPage} theme={theme} />
    <AnimatePresence>{toast && <Toast text={toast}/>}</AnimatePresence>
    <AnimatePresence>{editor && <EditSheet item={editor} theme={theme} onClose={()=>setEditor(null)} onSave={updateTransaction} onDelete={deleteTransaction}/>}</AnimatePresence>
    <AnimatePresence>{entryMode && <EntrySheet mode={entryMode} theme={theme} payment={payment} setPayment={setPayment} onClose={()=>setEntryMode(null)} onAdd={(tx)=>{addTransaction(tx);setEntryMode(null)}}/>}</AnimatePresence>
  </div>
}

function HomePage({ transactions, quickKeys, addTransaction, setEditor, setPage, setEntryMode, theme }) {
  const summary = getSummary(transactions)
  const keys = quickKeys.filter(k=>k.visible).slice(0,8)
  return <div className="page">
    <Header title="MoneyFlow" subtitle="清楚記錄每一天的金錢流向。" />
    <div className={`wallet-card bg-gradient-to-br ${theme.accent}`}>
      <div>
        <p>本月結餘</p>
        <h2>{money.format(summary.balance)}</h2>
      </div>
      <WalletCards/>
      <div className="wallet-grid">
        <Small label="支出" value={money.format(summary.expense)} />
        <Small label="收入" value={money.format(summary.income)} />
        <Small label="儲蓄" value={money.format(summary.saving)} />
        <Small label="今日" value={money.format(summary.todayExpense)} />
        <Small label="儲蓄率" value={`${summary.savingRate}%`} />
        <Small label="本月" value={`${summary.monthCount} 筆`} />
      </div>
    </div>
    <div className="quick-actions">
      <button onClick={()=>setPage('quick')} className="qa dark"><PlusCircle size={18}/>記帳</button>
      <button onClick={()=>setEntryMode('income')} className="qa income"><WalletCards size={18}/>收入</button>
      <button onClick={()=>setEntryMode('saving')} className="qa saving"><PiggyBank size={18}/>儲蓄</button>
    </div>
    <Panel theme={theme}>
      <Section title="最近常用快捷交易" sub="最多 8 個，可在 Settings 管理" />
      <div className="quick-key-grid">
        {keys.map(k => <button key={k.id} className="quick-key" onClick={()=>addTransaction(makeTx('expense',k.amount,k.category,k.emoji,k.payment,todayISO(),k.name))}>
          <span>{k.emoji}</span><b>{k.name}</b><em>{money.format(k.amount)} · {k.payment}</em>
        </button>)}
      </div>
    </Panel>
    <Timeline transactions={transactions} setEditor={setEditor} theme={theme}/>
  </div>
}

function QuickAddPage({ theme, payment, setPayment, quickKeys, addTransaction }) {
  const [amount, setAmount] = useState('0')
  const [date, setDate] = useState(todayISO())
  const [custom, setCustom] = useState(false)
  const press = (v) => {
    if (v === 'del') return setAmount(a => a.length > 1 ? a.slice(0,-1) : '0')
    if (v === 'clear') return setAmount('0')
    if (v === '.' && amount.includes('.')) return
    setAmount(a => a === '0' && v !== '.' ? v : a + v)
  }
  const addExpense = (cat) => {
    const n = Number(amount)
    if (!n) return
    addTransaction(makeTx('expense', n, cat.name, cat.emoji, payment, date, ''))
    setAmount('0')
  }
  return <div className="page">
    <Header title="Quick Add" subtitle="一屏完成，不用上下拉動。" />
    <Panel theme={theme}>
      <div className="quick-layout">
        <div className="calculator-zone">
          <div className={`amount-display bg-gradient-to-br ${theme.accent}`}>{money.format(Number(amount || 0))}</div>
          <DateChooser date={date} setDate={setDate} custom={custom} setCustom={setCustom}/>
          <div className="pay-scroll">
            {paymentMethods.map(p => <button key={p} onClick={()=>setPayment(p)} className={payment===p ? 'chip selected' : 'chip'}>{p}</button>)}
          </div>
          <div className="keypad">
            {['1','2','3','4','5','6','7','8','9','.','0','del'].map(k=><button key={k} onClick={()=>press(k)}>{k==='del'?'⌫':k}</button>)}
          </div>
          <button className="clear-btn" onClick={()=>press('clear')}>清除</button>
        </div>
        <div className="category-zone">
          {expenseCategories.map(c => <button key={c.name} onClick={()=>addExpense(c)} className="cat-btn">
            <span>{c.emoji}</span><b>{c.name}</b>
          </button>)}
        </div>
      </div>
    </Panel>
    <Panel theme={theme}>
      <Section title="快捷交易" sub="使用目前選擇日期新增" />
      <div className="key-strip">
        {quickKeys.filter(k=>k.visible).slice(0,8).map(k => <button key={k.id} onClick={()=>addTransaction(makeTx('expense',k.amount,k.category,k.emoji,k.payment,date,k.name))}>
          <span>{k.emoji}</span><b>{k.name}</b><em>{money.format(k.amount)}</em>
        </button>)}
      </div>
    </Panel>
  </div>
}

function CalendarPage({ transactions, setEditor, theme }) {
  const [month, setMonth] = useState(new Date())
  const [selected, setSelected] = useState(null)
  const days = getCalendarDays(month)
  const ym = month.toISOString().slice(0,7)
  return <div className="page">
    <Header title="Calendar" subtitle="只保留日曆，點日期查看交易。" />
    <Panel theme={theme}>
      <div className="month-head">
        <button onClick={()=>setMonth(new Date(month.getFullYear(), month.getMonth()-1, 1))}><ChevronLeft/></button>
        <h2>{month.getFullYear()} 年 {month.getMonth()+1} 月</h2>
        <button onClick={()=>setMonth(new Date(month.getFullYear(), month.getMonth()+1, 1))}><ChevronRight/></button>
      </div>
      <div className="week-row">{['日','一','二','三','四','五','六'].map(d=><b key={d}>{d}</b>)}</div>
      <div className="calendar-grid">
        {days.map(d => {
          const iso = d.toISOString().slice(0,10)
          const list = transactions.filter(t=>t.date===iso)
          const exp = list.filter(t=>t.type==='expense').reduce((a,b)=>a+b.amount,0)
          const inc = list.filter(t=>t.type==='income').reduce((a,b)=>a+b.amount,0)
          const sav = list.filter(t=>t.type==='saving').reduce((a,b)=>a+b.amount,0)
          const inMonth = iso.startsWith(ym)
          return <button key={iso} onClick={()=>setSelected({iso,list})} className={`day-cell ${!inMonth?'muted':''} ${iso===todayISO()?'today':''}`}>
            <strong>{d.getDate()}</strong>
            {exp>0 && <span className="mark red">-{Math.round(exp)}</span>}
            {inc>0 && <span className="mark green">+{Math.round(inc)}</span>}
            {sav>0 && <span className="mark blue">🐷 {Math.round(sav)}</span>}
          </button>
        })}
      </div>
    </Panel>
    <AnimatePresence>{selected && <BottomSheet title={`${selected.iso} 交易`} theme={theme} onClose={()=>setSelected(null)}>
      {selected.list.length ? selected.list.map(t=><button key={t.id} className="row-btn" onClick={()=>{setEditor(t);setSelected(null)}}><span>{t.emoji} {t.note || t.category}</span><b>{money.format(t.amount)}</b></button>) : <Empty text="這天未有交易。" />}
    </BottomSheet>}</AnimatePresence>
  </div>
}

function StatsPage({ transactions, theme }) {
  const [month, setMonth] = useState(new Date())
  const ym = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}`
  const monthLabel = `${month.getFullYear()}年${month.getMonth()+1}月`
  const monthTx = transactions.filter(t=>t.date && t.date.startsWith(ym))
  const expenseTx = monthTx.filter(t=>t.type==='expense')
  const totalExpense = expenseTx.reduce((a,b)=>a+b.amount,0)
  const catData = aggregate(expenseTx, 'category')
  const daily = monthDailyExpense(expenseTx, month)
  const dailyMax = monthDailyMax(expenseTx, month)
  const monthlyMax = topExpenses(expenseTx, 1)[0]
  const colors = theme.colors

  const chart = (id, title, sub, body) => <Panel theme={theme} id={`chart-${id}`}>
    <div className="chart-head">
      <div><h3>{title}</h3><p>{sub}</p></div>
      <div><button onClick={()=>downloadElement(`chart-${id}`, `${title}-${ym}.png`)}><Download size={16}/></button><button onClick={()=>shareElement(`chart-${id}`, `${title}-${ym}.png`)}><Share2 size={16}/></button></div>
    </div>
    {body}
  </Panel>

  return <div className="page">
    <div className="topline">
      <Header title="Stats" subtitle="每月累計支出及專業圖卡。" />
      <button className={`story-btn bg-gradient-to-r ${theme.accent}`} onClick={()=>downloadStory('stats-story', `MoneyFlow-${ym}-IG-Story.png`)}>生成IG圖</button>
    </div>

    <div className={`month-total bg-gradient-to-br ${theme.accent}`}>
      <button onClick={()=>setMonth(new Date(month.getFullYear(), month.getMonth()-1, 1))}><ChevronLeft/></button>
      <div><span>{monthLabel}</span><small>每月累計支出</small><strong>{money.format(totalExpense)}</strong></div>
      <button onClick={()=>setMonth(new Date(month.getFullYear(), month.getMonth()+1, 1))}><ChevronRight/></button>
    </div>

    <div id="stats-story" className="story-card">
      <div className={`story-inner bg-gradient-to-br ${theme.accent}`}>
        <div className="story-title"><div><span>MoneyFlow Monthly Stats</span><h2>{monthLabel}</h2></div><b>IG Story</b></div>
        <div className="story-main"><span>每月累計支出</span><strong>{money.format(totalExpense)}</strong></div>
        <div className="story-panels">
          <div><span>最大單項消費</span><strong>{monthlyMax ? money.format(monthlyMax.amount) : money.format(0)}</strong><small>{monthlyMax ? `${monthlyMax.emoji} ${monthlyMax.note || monthlyMax.category}` : '未有支出'}</small></div>
          <div><span>最高消費日</span><strong>{topDay(daily)?.date || '-'}</strong><small>{topDay(daily) ? money.format(topDay(daily).expense) : '未有記錄'}</small></div>
        </div>
        <div className="story-bars">
          <h3>類別開支比例</h3>
          {catData.slice(0,5).map((d,i)=><div className="story-bar" key={d.name}><span>{d.name}</span><i><em style={{width:`${Math.max(4,totalExpense?d.value/totalExpense*100:0)}%`,background:colors[i%colors.length]}}></em></i><b>{Math.round(totalExpense?d.value/totalExpense*100:0)}%</b></div>)}
        </div>
        <footer>清楚記錄每一天的金錢流向</footer>
      </div>
    </div>

    {chart('category', '類別開支比例', '顯示類別、百分比及金額',
      <div className="chart-box">{catData.length ? <ResponsiveContainer><PieChart><Pie data={catData} dataKey="value" nameKey="name" outerRadius={86} labelLine label={({name,percent,value})=>`${name} ${(percent*100).toFixed(0)}% · ${money.format(value)}`}>{catData.map((_,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip formatter={(v)=>money.format(v)}/></PieChart></ResponsiveContainer> : <Empty text="本月未有支出資料。" />}</div>
    )}

    {chart('daily', '每日消費變化', '顯示本月每日累計支出',
      <div className="chart-box"><ResponsiveContainer><LineChart data={daily}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day"/><YAxis/><Tooltip formatter={(v)=>money.format(v)}/><Line type="monotone" dataKey="expense" stroke={colors[0]} strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></div>
    )}

    {chart('dailymax', '每日最大單項消費', '每日更新，找出每天最大一筆支出',
      <div className="chart-box"><ResponsiveContainer><BarChart data={dailyMax}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day"/><YAxis/><Tooltip formatter={(v)=>money.format(v)}/><Bar dataKey="max" fill={colors[2]} radius={[12,12,0,0]}/></BarChart></ResponsiveContainer></div>
    )}

    {chart('monthmax', '每月最大單項消費', '每月更新，配合美化圖片展示',
      <div>
        <div className={`max-purchase bg-gradient-to-br ${theme.accent}`}>
          <div>{monthlyMax?.emoji || '🏆'}</div>
          <section><span>本月最大單項消費</span><strong>{monthlyMax ? money.format(monthlyMax.amount) : money.format(0)}</strong><p>{monthlyMax ? `${monthlyMax.note || monthlyMax.category} · ${monthlyMax.payment} · ${monthlyMax.date}` : '本月未有支出'}</p></section>
        </div>
        <div className="podium">{topExpenses(expenseTx,3).map((t,i)=><article key={t.id}><span>{i===0?'🥇':i===1?'🥈':'🥉'}</span><b>{t.note || t.category}</b><em>{money.format(t.amount)}</em></article>)}</div>
      </div>
    )}
  </div>
}

function SettingsPage({ theme, themeId, setThemeId, quickKeys, setQuickKeys, transactions, setTransactions, notify }) {
  const [draft, setDraft] = useState({emoji:'☕', name:'Coffee', amount:'38', category:'雜項', payment:'八達通', visible:true})
  const fileRef = useRef(null)
  const addKey = () => {
    if (!draft.name || !Number(draft.amount)) return
    setQuickKeys([...quickKeys, {...draft, id:uid(), amount:Number(draft.amount)}])
    setDraft({emoji:'☕', name:'Coffee', amount:'38', category:'雜項', payment:'八達通', visible:true})
    notify('快捷鍵已新增')
  }
  const updateKey = (id, patch) => setQuickKeys(quickKeys.map(k=>k.id===id?{...k,...patch}:k))
  const deleteKey = (id) => setQuickKeys(quickKeys.filter(k=>k.id!==id))
  const move = (i, dir) => {
    const arr = [...quickKeys]
    const ni = i + dir
    if (ni < 0 || ni >= arr.length) return
    const [x] = arr.splice(i,1)
    arr.splice(ni,0,x)
    setQuickKeys(arr)
  }
  const reset = () => {
    if(!confirm('確定要重設所有資料嗎？')) return
    if(!confirm('此操作無法還原，確定刪除？')) return
    localStorage.clear()
    location.reload()
  }
  const exportCsv = () => {
    const rows = [['type','amount','category','payment','date','note'], ...transactions.map(t=>[t.type,t.amount,t.category,t.payment,t.date,t.note])]
    const csv = rows.map(r=>r.map(x=>`"${String(x??'').replaceAll('"','""')}"`).join(',')).join('\n')
    downloadBlob(csv, 'moneyflow.csv', 'text/csv')
  }
  const exportJson = () => downloadBlob(JSON.stringify({transactions,quickKeys}, null, 2), 'moneyflow-backup.json', 'application/json')
  return <div className="page">
    <Header title="Settings" subtitle="Theme Studio、快捷鍵與備份。" />
    <Panel theme={theme}>
      <Section title="Theme Studio" sub="真正改變配色、卡片、Bottom Nav 及圖表。" />
      <div className="theme-grid">
        {Object.entries(themes).map(([id,t])=><button key={id} onClick={()=>setThemeId(id)} className={themeId===id?'theme-tile active':'theme-tile'}><i className={`bg-gradient-to-r ${t.accent}`}></i><b>{t.name}</b><span>{t.desc}</span></button>)}
      </div>
    </Panel>
    <Panel theme={theme}>
      <Section title="自訂常用快捷鍵" sub="可新增、刪除、排序、開關顯示。" />
      <div className="key-form">
        <input value={draft.emoji} onChange={e=>setDraft({...draft,emoji:e.target.value})} placeholder="Emoji"/>
        <input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="名稱"/>
        <input value={draft.amount} onChange={e=>setDraft({...draft,amount:e.target.value})} placeholder="金額"/>
        <button onClick={addKey}>新增</button>
      </div>
      <div className="key-list">
        {quickKeys.map((k,i)=><div key={k.id} className="key-row"><GripVertical size={16}/><span>{k.emoji} <b>{k.name}</b><small>{money.format(k.amount)} · {k.category} · {k.payment}</small></span><button onClick={()=>updateKey(k.id,{visible:!k.visible})}>{k.visible?'顯示':'隱藏'}</button><button onClick={()=>move(i,-1)}>↑</button><button onClick={()=>move(i,1)}>↓</button><button onClick={()=>deleteKey(k.id)}><Trash2 size={15}/></button></div>)}
      </div>
    </Panel>
    <Panel theme={theme}>
      <Section title="資料管理" />
      <div className="settings-grid">
        <button onClick={exportCsv}><Download size={18}/>匯出 CSV</button>
        <button onClick={exportJson}><Save size={18}/>匯出 JSON</button>
        <button onClick={()=>fileRef.current?.click()}><Upload size={18}/>匯入 JSON</button>
        <button className="danger" onClick={reset}><Trash2 size={18}/>Demo Reset</button>
      </div>
      <input ref={fileRef} type="file" hidden accept="application/json" onChange={async e=>{
        const f=e.target.files?.[0]; if(!f) return
        const data=JSON.parse(await f.text())
        if(data.transactions) setTransactions(data.transactions)
        if(data.quickKeys) setQuickKeys(data.quickKeys)
        notify('已匯入備份')
      }}/>
    </Panel>
  </div>
}

function DateChooser({ date, setDate, custom, setCustom }) {
  return <div className="date-box">
    <div className="date-tabs">
      <button className={date===todayISO()&&!custom?'active':''} onClick={()=>{setDate(todayISO());setCustom(false)}}>今天</button>
      <button className={date===yesterdayISO()&&!custom?'active':''} onClick={()=>{setDate(yesterdayISO());setCustom(false)}}>昨天</button>
      <button className={custom?'active':''} onClick={()=>setCustom(v=>!v)}>自訂日期</button>
    </div>
    {custom && <div className="date-picker"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/><small>已選日期：{date}</small></div>}
  </div>
}

function EntrySheet({ mode, theme, payment, setPayment, onClose, onAdd }) {
  const isIncome = mode === 'income'
  const cats = isIncome ? incomeCategories : savingCategories
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(cats[0])
  const [date, setDate] = useState(todayISO())
  const [custom, setCustom] = useState(false)
  const [note, setNote] = useState('')
  const save = () => {
    const n = Number(amount)
    if (!n) return
    onAdd(makeTx(mode,n,category,isIncome?'💰':'🐷',payment,date,note))
  }
  return <BottomSheet title={isIncome?'新增收入':'新增儲蓄'} theme={theme} onClose={onClose}>
    <div className="sheet-form">
      <input className="big-input" inputMode="decimal" autoFocus value={amount} onChange={e=>setAmount(e.target.value)} placeholder="金額"/>
      <div className="choice-grid">{cats.map(c=><button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
      <DateChooser date={date} setDate={setDate} custom={custom} setCustom={setCustom}/>
      <div className="pay-scroll">{paymentMethods.map(p=><button key={p} onClick={()=>setPayment(p)} className={payment===p?'chip selected':'chip'}>{p}</button>)}</div>
      <input value={note} onChange={e=>setNote(e.target.value)} placeholder="備註，可留空"/>
      <button className={`save-btn bg-gradient-to-r ${theme.accent}`} onClick={save}>儲存</button>
    </div>
  </BottomSheet>
}

function EditSheet({ item, theme, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(item)
  const [custom, setCustom] = useState(false)
  return <BottomSheet title="編輯交易" theme={theme} onClose={onClose}>
    <div className="sheet-form">
      <input value={draft.note || ''} onChange={e=>setDraft({...draft,note:e.target.value})} placeholder="描述"/>
      <input inputMode="decimal" value={draft.amount} onChange={e=>setDraft({...draft,amount:Number(e.target.value)})}/>
      <input value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}/>
      <select value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value})}><option value="expense">支出</option><option value="income">收入</option><option value="saving">儲蓄</option></select>
      <DateChooser date={draft.date} setDate={(date)=>setDraft({...draft,date})} custom={custom} setCustom={setCustom}/>
      <div className="pay-scroll">{paymentMethods.map(p=><button key={p} onClick={()=>setDraft({...draft,payment:p})} className={draft.payment===p?'chip selected':'chip'}>{p}</button>)}</div>
      <button className={`save-btn bg-gradient-to-r ${theme.accent}`} onClick={()=>onSave(draft)}>儲存</button>
      <button className="delete-btn" onClick={()=>onDelete(draft.id)}>刪除</button>
    </div>
  </BottomSheet>
}

function Timeline({ transactions, setEditor, theme }) {
  return <Panel theme={theme}><Section title="Timeline" sub="點擊可修改日期、描述及支付方式" />
    <div className="timeline">
      {transactions.length ? transactions.slice(0,22).map(t=><button className="tx-row" key={t.id} onClick={()=>setEditor(t)}><span>{t.emoji}</span><div><b>{t.note || t.category}</b><small>{t.date} · {t.payment} · {labelType(t.type)}</small></div><strong className={t.type==='expense'?'out':'in'}>{t.type==='expense'?'-':'+'}{money.format(t.amount)}</strong></button>) : <Empty text="未有交易。"/>}
    </div>
  </Panel>
}

function Panel({ theme, children, id }) { return <section id={id} className={`panel ${theme.card}`}>{children}</section> }
function Header({ title, subtitle }) { return <header className="header"><h1>{title}</h1><p>{subtitle}</p></header> }
function Section({ title, sub }) { return <div className="section-title"><h2>{title}</h2>{sub && <p>{sub}</p>}</div> }
function Small({ label, value }) { return <div><span>{label}</span><b>{value}</b></div> }
function Empty({ text }) { return <div className="empty">☁️<br/>{text}</div> }
function Toast({ text }) { return <motion.div className="toast" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}><CheckCircle2 size={18}/>{text}</motion.div> }
function BottomSheet({ title, theme, onClose, children }) { return <motion.div className="sheet-wrap" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.div className={`sheet ${theme.card}`} initial={{y:250}} animate={{y:0}} exit={{y:250}} transition={{type:'spring',damping:24,stiffness:260}}><div className="sheet-head"><h3>{title}</h3><button onClick={onClose}><X/></button></div>{children}</motion.div></motion.div> }
function BottomNav({ page, setPage, theme }) {
  const items = [['home',Home,'Home'],['quick',PlusCircle,'Quick'],['calendar',CalendarDays,'Calendar'],['stats',BarChart3,'Stats'],['settings',Settings,'Settings']]
  return <nav className={`bottom-nav ${theme.card}`}>{items.map(([id,Icon,label])=><button key={id} onClick={()=>setPage(id)} className={page===id?'active':''}><Icon size={19}/><span>{label}</span></button>)}</nav>
}

function labelType(type) { return type==='income'?'收入':type==='saving'?'儲蓄':'支出' }
function getSummary(transactions) {
  const ym = todayISO().slice(0,7)
  const month = transactions.filter(t=>t.date?.startsWith(ym))
  const sum = (type) => month.filter(t=>t.type===type).reduce((a,b)=>a+b.amount,0)
  const expense=sum('expense'), income=sum('income'), saving=sum('saving')
  return { expense, income, saving, balance: income-expense-saving, todayExpense: month.filter(t=>t.date===todayISO()&&t.type==='expense').reduce((a,b)=>a+b.amount,0), savingRate: income?Math.round(saving/income*100):0, monthCount: month.length }
}
function getCalendarDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  return Array.from({length:42}, (_,i)=>{ const d = new Date(start); d.setDate(start.getDate()+i); return d })
}
function aggregate(list, key) {
  const map = {}
  list.forEach(t => map[t[key] || '其他'] = (map[t[key] || '其他'] || 0) + Number(t.amount||0))
  return Object.entries(map).map(([name,value])=>({name,value})).filter(x=>x.value>0)
}
function monthDailyExpense(list, month) {
  const y=month.getFullYear(), m=month.getMonth(), n=new Date(y,m+1,0).getDate()
  return Array.from({length:n},(_,i)=>{ const day=i+1; const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; return {day, date:iso, expense:list.filter(t=>t.date===iso).reduce((a,b)=>a+b.amount,0)} })
}
function monthDailyMax(list, month) {
  const y=month.getFullYear(), m=month.getMonth(), n=new Date(y,m+1,0).getDate()
  return Array.from({length:n},(_,i)=>{ const day=i+1; const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; const daily=list.filter(t=>t.date===iso); return {day, date:iso, max:daily.length?Math.max(...daily.map(t=>t.amount)):0} })
}
function topExpenses(list, n=3) { return [...list].sort((a,b)=>b.amount-a.amount).slice(0,n) }
function topDay(daily) { return [...daily].sort((a,b)=>b.expense-a.expense)[0] }
async function downloadElement(id, filename) {
  const el = document.getElementById(id); if(!el) return
  const canvas = await html2canvas(el, { backgroundColor:null, scale:2 })
  const a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download=filename; a.click()
}
async function shareElement(id, filename) {
  const el = document.getElementById(id); if(!el) return
  const canvas = await html2canvas(el, { backgroundColor:null, scale:2 })
  canvas.toBlob(async blob => {
    const file = new File([blob], filename, { type:'image/png' })
    if (navigator.canShare?.({files:[file]})) await navigator.share({title:'MoneyFlow', text:'MoneyFlow 圖卡', files:[file]})
    else { const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); alert('已下載圖片，可手動分享到 IG / WhatsApp。') }
  })
}
async function downloadStory(id, filename) {
  const el = document.getElementById(id); if(!el) return
  const canvas = await html2canvas(el, { backgroundColor:null, scale:3, width:360, height:640 })
  const out = document.createElement('canvas'); out.width=1080; out.height=1920
  out.getContext('2d').drawImage(canvas,0,0,1080,1920)
  out.toBlob(blob => { const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click() }, 'image/png')
}
function downloadBlob(text, filename, type) { const b=new Blob([text],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=filename; a.click() }

createRoot(document.getElementById('root')).render(<App />)
