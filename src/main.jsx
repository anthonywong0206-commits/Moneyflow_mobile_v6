import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas'
import './style.css'

const money = new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD', maximumFractionDigits: 1 })
const todayISO = () => new Date().toISOString().slice(0,10)
const yesterdayISO = () => { const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10) }
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

const cats = [
  ['早餐','🍳'], ['午餐','🍱'], ['晚餐','🍜'], ['交通','🚌'], ['購物','🛍'], ['寵物','🐶'], ['雜項','📦']
]
const payments = ['現金','八達通','支付寶','信用卡','PayMe','FPS']
const incomeCats = ['薪金','兼職','津貼','退款','利息','禮金','其他收入']
const savingCats = ['定期儲蓄','投資戶口','應急基金','旅行基金','寵物基金','其他儲蓄']
const themeList = {
  pro: ['金融專業版','pro'],
  jp: ['日本文青版','jp'],
  fairy: ['童話風','fairy'],
  cat: ['貓貓可愛版','cat'],
  neon: ['Cyber Neon','neon']
}
const colors = ['#0f172a','#0284c7','#10b981','#f97316','#e11d48','#8b5cf6','#64748b']

function makeTx(type, amount, category, emoji, payment, date, note='') {
  return { id: uid(), type, amount: Number(amount), category, emoji, payment, date, note }
}
function seedTx() {
  const d = n => { const x=new Date(); x.setDate(x.getDate()-n); return x.toISOString().slice(0,10) }
  return [
    makeTx('expense',55,'午餐','🍱','八達通',d(0),'午餐'),
    makeTx('expense',12,'交通','🚌','八達通',d(0),'MTR'),
    makeTx('income',12000,'薪金','💰','FPS',d(2),'薪金'),
    makeTx('saving',500,'應急基金','🐷','FPS',d(1),'每週儲蓄'),
    makeTx('expense',88,'寵物','🐶','信用卡',d(3),'貓糧'),
    makeTx('expense',70,'晚餐','🍜','支付寶',d(4),'晚餐'),
    makeTx('expense',8.5,'交通','🚌','八達通',d(5),'巴士'),
    makeTx('expense',120,'購物','🛍','信用卡',d(6),'生活用品')
  ]
}
const seedKeys = [
  {id:uid(), emoji:'🍱', name:'午餐', amount:55, category:'午餐', payment:'八達通', visible:true},
  {id:uid(), emoji:'🚇', name:'MTR', amount:12, category:'交通', payment:'八達通', visible:true},
  {id:uid(), emoji:'🚌', name:'巴士', amount:8.5, category:'交通', payment:'八達通', visible:true},
  {id:uid(), emoji:'🚕', name:'的士', amount:60, category:'交通', payment:'信用卡', visible:true},
  {id:uid(), emoji:'🐱', name:'貓糧', amount:88, category:'寵物', payment:'信用卡', visible:true},
  {id:uid(), emoji:'🍜', name:'晚餐', amount:70, category:'晚餐', payment:'支付寶', visible:true}
]

function useStore(key, initial) {
  const [v, setV] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || initial } catch { return initial }
  })
  const save = next => {
    const val = typeof next === 'function' ? next(v) : next
    setV(val)
    localStorage.setItem(key, JSON.stringify(val))
  }
  return [v, save]
}

function App() {
  const [page, setPage] = useStore('pigpocket-page','home')
  const [txs, setTxs] = useStore('pigpocket-txs', seedTx())
  const [keys, setKeys] = useStore('pigpocket-keys', seedKeys)
  const [theme, setTheme] = useStore('pigpocket-theme','cat')
  const [payment, setPayment] = useStore('pigpocket-payment','八達通')
  const [editing, setEditing] = useState(null)
  const [entry, setEntry] = useState(null)
  const [toast, setToast] = useState('')

  const notify = msg => { setToast(msg); setTimeout(()=>setToast(''),1600) }
  const addTx = tx => { setTxs([tx, ...txs]); notify(`已新增 ${tx.category} ${money.format(tx.amount)}`) }
  const updateTx = tx => { setTxs(txs.map(x=>x.id===tx.id?tx:x)); setEditing(null); notify('已更新') }
  const delTx = id => { setTxs(txs.filter(x=>x.id!==id)); setEditing(null); notify('已刪除') }

  const props = { txs, setTxs, keys, setKeys, theme, setTheme, payment, setPayment, addTx, setEditing, setEntry, notify }

  return <div className={`app ${theme}`}>
    <main>
      {page==='home' && <HomePage {...props} setPage={setPage}/>}
      {page==='quick' && <QuickPage {...props}/>}
      {page==='calendar' && <CalendarPage {...props}/>}
      {page==='stats' && <StatsPage {...props}/>}
      {page==='settings' && <SettingsPage {...props}/>}
    </main>
    <nav className="nav">
      {[
        ['home','⌂','Home'],['quick','＋','Quick'],['calendar','◷','Calendar'],['stats','◬','Stats'],['settings','⚙','Settings']
      ].map(([id, icon, label]) => <button key={id} onClick={()=>setPage(id)} className={page===id?'on':''}><b>{icon}</b><span>{label}</span></button>)}
    </nav>
    {editing && <EditSheet item={editing} onSave={updateTx} onDelete={delTx} onClose={()=>setEditing(null)} />}
    {entry && <EntrySheet mode={entry} payment={payment} setPayment={setPayment} onClose={()=>setEntry(null)} onAdd={tx=>{addTx(tx); setEntry(null)}} />}
    {toast && <div className="toast">✓ {toast}</div>}
  </div>
}

function HomePage({txs, keys, addTx, setEditing, setPage, setEntry}) {
  const s = summary(txs)
  return <div className="page">
    <Header title="Pig Pocket" sub="讓記帳變成一件可愛的事。" />
    <section className="hero-pig"><div><p className="badge">小豬記帳 · 3秒完成記錄</p><h2>今日都有好好照顧錢包 🐷</h2><span>支出、收入、儲蓄，一眼看清。</span></div><div className="piggy">🐷</div></section>
    <section className="wallet">
      <p>本月結餘</p><h2>{money.format(s.balance)}</h2>
      <div className="walletgrid">
        <Small label="支出" value={money.format(s.expense)}/>
        <Small label="收入" value={money.format(s.income)}/>
        <Small label="儲蓄" value={money.format(s.saving)}/>
        <Small label="今日" value={money.format(s.today)}/>
        <Small label="儲蓄率" value={`${s.rate}%`}/>
        <Small label="紀錄" value={`${s.count} 筆`}/>
      </div>
    </section>
    <div className="actions">
      <button onClick={()=>setPage('quick')}>＋ 記帳</button>
      <button className="green" onClick={()=>setEntry('income')}>＋ 收入</button>
      <button className="purple" onClick={()=>setEntry('saving')}>＋ 儲蓄</button>
    </div>
    <Panel title="最近常用快捷交易" sub="最多 8 個，可在 Settings 管理">
      <div className="quickgrid">
        {keys.filter(k=>k.visible).slice(0,8).map(k=><button key={k.id} onClick={()=>addTx(makeTx('expense',k.amount,k.category,k.emoji,k.payment,todayISO(),k.name))}>
          <i>{k.emoji}</i><b>{k.name}</b><span>{money.format(k.amount)} · {k.payment}</span>
        </button>)}
      </div>
    </Panel>
    <Timeline txs={txs} setEditing={setEditing}/>
  </div>
}
function QuickPage({payment,setPayment,keys,addTx}) {
  const [amount,setAmount] = useState('0')
  const [date,setDate] = useState(todayISO())
  const [custom,setCustom] = useState(false)
  const press = v => {
    if(v==='del') return setAmount(a=>a.length>1?a.slice(0,-1):'0')
    if(v==='clear') return setAmount('0')
    if(v==='.' && amount.includes('.')) return
    setAmount(a=>a==='0'&&v!=='.'?v:a+v)
  }
  const submit = ([name,emoji]) => {
    const n = Number(amount)
    if(!n) return
    addTx(makeTx('expense', n, name, emoji, payment, date, ''))
    setAmount('0')
  }
  return <div className="page">
    <Header title="Quick Add" sub="一屏完成，不需上下拉動。" />
    <Panel>
      <div className="quicklayout">
        <div className="calc">
          <div className="amount">{money.format(Number(amount||0))}</div>
          <DatePick date={date} setDate={setDate} custom={custom} setCustom={setCustom}/>
          <div className="chips">{payments.map(p=><button key={p} onClick={()=>setPayment(p)} className={payment===p?'sel':''}>{p}</button>)}</div>
          <div className="pad">{['1','2','3','4','5','6','7','8','9','.','0','del'].map(k=><button key={k} onClick={()=>press(k)}>{k==='del'?'⌫':k}</button>)}</div>
          <button className="clear" onClick={()=>press('clear')}>清除</button>
        </div>
        <div className="catlist">{cats.map(c=><button key={c[0]} onClick={()=>submit(c)}><i>{c[1]}</i><b>{c[0]}</b></button>)}</div>
      </div>
    </Panel>
    <Panel title="快捷交易">
      <div className="strip">{keys.filter(k=>k.visible).slice(0,8).map(k=><button key={k.id} onClick={()=>addTx(makeTx('expense',k.amount,k.category,k.emoji,k.payment,date,k.name))}><i>{k.emoji}</i><b>{k.name}</b><span>{money.format(k.amount)}</span></button>)}</div>
    </Panel>
  </div>
}
function CalendarPage({txs,setEditing}) {
  const [month,setMonth] = useState(new Date())
  const [selected,setSelected] = useState(null)
  const days = calendarDays(month)
  const ym = ymOf(month)
  return <div className="page">
    <Header title="Calendar" sub="只保留日曆，點日期查看交易。" />
    <Panel>
      <div className="monthbar"><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}>‹</button><b>{month.getFullYear()} 年 {month.getMonth()+1} 月</b><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}>›</button></div>
      <div className="week">{['日','一','二','三','四','五','六'].map(d=><b key={d}>{d}</b>)}</div>
      <div className="calgrid">
        {days.map(d=>{
          const iso = isoOf(d)
          const list = txs.filter(t=>t.date===iso)
          const exp=sum(list,'expense'), inc=sum(list,'income'), sav=sum(list,'saving')
          return <button key={iso} onClick={()=>setSelected({iso,list})} className={`${iso.startsWith(ym)?'':'fade'} ${iso===todayISO()?'today':''}`}>
            <strong>{d.getDate()}</strong>{exp>0&&<em className="red">-{Math.round(exp)}</em>}{inc>0&&<em className="green">+{Math.round(inc)}</em>}{sav>0&&<em className="blue">🐷 {Math.round(sav)}</em>}
          </button>
        })}
      </div>
    </Panel>
    {selected && <Sheet title={selected.iso} onClose={()=>setSelected(null)}>
      {selected.list.length?selected.list.map(t=><button className="row" key={t.id} onClick={()=>{setEditing(t);setSelected(null)}}><span>{t.emoji} {t.note||t.category}</span><b>{money.format(t.amount)}</b></button>):<p className="empty">這天未有交易</p>}
    </Sheet>}
  </div>
}
function StatsPage({txs}) {
  const [month,setMonth] = useState(new Date())
  const ym = ymOf(month)
  const label = `${month.getFullYear()}年${month.getMonth()+1}月`
  const expenses = txs.filter(t=>t.type==='expense' && t.date?.startsWith(ym))
  const total = expenses.reduce((a,b)=>a+b.amount,0)
  const cat = aggregate(expenses,'category')
  const daily = dailyData(expenses, month)
  const dailyMax = dailyMaxData(expenses, month)
  const max = [...expenses].sort((a,b)=>b.amount-a.amount)[0]
  return <div className="page">
    <div className="topline"><Header title="Stats" sub="每月累計支出及專業圖卡。" /><button className="storybtn" onClick={()=>downloadStory('story',`Pig Pocket-${ym}-IG-Story.png`)}>生成IG圖</button></div>
    <section className="monthtotal"><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}>‹</button><div><span>{label}</span><small>每月累計支出</small><strong>{money.format(total)}</strong></div><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}>›</button></section>
    <Story id="story" label={label} total={total} cat={cat} daily={daily} max={max}/>
    <Panel title="類別開支比例" sub="顯示類別、百分比及金額">
      <PieLike data={cat} total={total}/>
    </Panel>
    <Panel title="每日消費變化" sub="顯示本月每日累計支出">
      <LineLike data={daily} field="expense"/>
    </Panel>
    <Panel title="每日最大單項消費" sub="每日更新，找出每天最大一筆支出">
      <BarLike data={dailyMax} field="max"/>
    </Panel>
    <Panel title="每月最大單項消費" sub="每月更新，配合美化圖片展示">
      <div className="maxcard"><i>{max?.emoji||'🏆'}</i><div><span>本月最大單項消費</span><b>{max?money.format(max.amount):money.format(0)}</b><p>{max?`${max.note||max.category} · ${max.payment} · ${max.date}`:'本月未有支出'}</p></div></div>
      <div className="podium">{[...expenses].sort((a,b)=>b.amount-a.amount).slice(0,3).map((t,i)=><article key={t.id}><i>{i===0?'🥇':i===1?'🥈':'🥉'}</i><b>{t.note||t.category}</b><span>{money.format(t.amount)}</span></article>)}</div>
    </Panel>
  </div>
}
function SettingsPage({theme,setTheme,keys,setKeys,txs,setTxs,notify}) {
  const [draft,setDraft] = useState({emoji:'☕',name:'Coffee',amount:'38',category:'雜項',payment:'八達通',visible:true})
  const addKey = () => { if(!draft.name||!Number(draft.amount))return; setKeys([...keys,{...draft,id:uid(),amount:Number(draft.amount)}]); notify('快捷鍵已新增') }
  const move = (i,d) => { const a=[...keys], ni=i+d; if(ni<0||ni>=a.length)return; const [x]=a.splice(i,1); a.splice(ni,0,x); setKeys(a) }
  const reset = () => { if(confirm('確定要重設所有資料嗎？')&&confirm('此操作無法還原，確定刪除？')){localStorage.clear(); location.reload()} }
  return <div className="page">
    <Header title="Settings" sub="Theme Studio、快捷鍵、備份。" />
    <Panel title="Theme Studio" sub="每種風格真正改變畫面。">
      <div className="themegrid">{Object.entries(themeList).map(([id,[name,cls]])=><button key={id} onClick={()=>setTheme(id)} className={theme===id?'on':''}><i className={cls}></i><b>{name}</b></button>)}</div>
    </Panel>
    <Panel title="自訂常用快捷鍵" sub="新增、刪除、排序、開關顯示。">
      <div className="keyform"><input value={draft.emoji} onChange={e=>setDraft({...draft,emoji:e.target.value})}/><input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/><input value={draft.amount} onChange={e=>setDraft({...draft,amount:e.target.value})}/><button onClick={addKey}>新增</button></div>
      <div className="keyrows">{keys.map((k,i)=><div key={k.id}><span>{k.emoji} <b>{k.name}</b><small>{money.format(k.amount)} · {k.category}</small></span><button onClick={()=>setKeys(keys.map(x=>x.id===k.id?{...x,visible:!x.visible}:x))}>{k.visible?'顯示':'隱藏'}</button><button onClick={()=>move(i,-1)}>↑</button><button onClick={()=>move(i,1)}>↓</button><button onClick={()=>setKeys(keys.filter(x=>x.id!==k.id))}>刪</button></div>)}</div>
    </Panel>
    <Panel title="資料管理">
      <div className="settingsBtns"><button onClick={()=>downloadBlob(csvOf(txs),'moneyflow.csv','text/csv')}>匯出 CSV</button><button onClick={()=>downloadBlob(JSON.stringify({txs,keys},null,2),'moneyflow.json','application/json')}>匯出 JSON</button><button className="danger" onClick={reset}>Demo Reset</button></div>
    </Panel>
  </div>
}

function EntrySheet({mode,payment,setPayment,onClose,onAdd}) {
  const cats2 = mode==='income'?incomeCats:savingCats
  const [amount,setAmount]=useState('')
  const [cat,setCat]=useState(cats2[0])
  const [date,setDate]=useState(todayISO())
  const [custom,setCustom]=useState(false)
  const [note,setNote]=useState('')
  const save=()=>{ const n=Number(amount); if(!n)return; onAdd(makeTx(mode,n,cat,mode==='income'?'💰':'🐷',payment,date,note)) }
  return <Sheet title={mode==='income'?'新增收入':'新增儲蓄'} onClose={onClose}>
    <div className="form"><input className="big" inputMode="decimal" autoFocus value={amount} onChange={e=>setAmount(e.target.value)} placeholder="金額"/><div className="choices">{cats2.map(c=><button key={c} className={cat===c?'sel':''} onClick={()=>setCat(c)}>{c}</button>)}</div><DatePick date={date} setDate={setDate} custom={custom} setCustom={setCustom}/><div className="chips">{payments.map(p=><button key={p} className={payment===p?'sel':''} onClick={()=>setPayment(p)}>{p}</button>)}</div><input value={note} onChange={e=>setNote(e.target.value)} placeholder="備註，可留空"/><button className="save" onClick={save}>儲存</button></div>
  </Sheet>
}
function EditSheet({item,onSave,onDelete,onClose}) {
  const [d,setD]=useState(item)
  const [custom,setCustom]=useState(false)
  return <Sheet title="編輯交易" onClose={onClose}>
    <div className="form"><input value={d.note||''} onChange={e=>setD({...d,note:e.target.value})}/><input inputMode="decimal" value={d.amount} onChange={e=>setD({...d,amount:Number(e.target.value)})}/><input value={d.category} onChange={e=>setD({...d,category:e.target.value})}/><select value={d.type} onChange={e=>setD({...d,type:e.target.value})}><option value="expense">支出</option><option value="income">收入</option><option value="saving">儲蓄</option></select><DatePick date={d.date} setDate={date=>setD({...d,date})} custom={custom} setCustom={setCustom}/><button className="save" onClick={()=>onSave(d)}>儲存</button><button className="delete" onClick={()=>onDelete(d.id)}>刪除</button></div>
  </Sheet>
}

function Header({title,sub}){return <header><h1>{title}</h1><p>{sub}</p></header>}
function Panel({title,sub,children}){return <section className="panel">{title&&<div className="section"><h2>{title}</h2>{sub&&<p>{sub}</p>}</div>}{children}</section>}
function Small({label,value}){return <div><span>{label}</span><b>{value}</b></div>}
function Timeline({txs,setEditing}){return <Panel title="Timeline" sub="點擊可編輯日期與描述"><div className="timeline">{txs.slice(0,24).map(t=><button className="tx" key={t.id} onClick={()=>setEditing(t)}><i>{t.emoji}</i><span><b>{t.note||t.category}</b><small>{t.date} · {t.payment}</small></span><strong className={t.type==='expense'?'redtxt':'greentxt'}>{t.type==='expense'?'-':'+'}{money.format(t.amount)}</strong></button>)}</div></Panel>}
function DatePick({date,setDate,custom,setCustom}){return <div className="datepick"><div><button className={date===todayISO()&&!custom?'sel':''} onClick={()=>{setDate(todayISO());setCustom(false)}}>今天</button><button className={date===yesterdayISO()&&!custom?'sel':''} onClick={()=>{setDate(yesterdayISO());setCustom(false)}}>昨天</button><button className={custom?'sel':''} onClick={()=>setCustom(!custom)}>自訂日期</button></div>{custom&&<aside><input type="date" value={date} onChange={e=>setDate(e.target.value)}/><small>已選日期：{date}</small></aside>}</div>}
function Sheet({title,onClose,children}){return <div className="overlay"><div className="sheet"><div className="sheethead"><h3>{title}</h3><button onClick={onClose}>×</button></div>{children}</div></div>}
function PieLike({data,total}){return <div className="pieWrap"><svg viewBox="0 0 42 42">{data.length?data.reduce((acc,d,i)=>{const val=total?d.value/total*100:0; const dash=`${val} ${100-val}`; const offset=25-acc.sum; acc.sum+=val; acc.nodes.push(<circle key={d.name} r="15.915" cx="21" cy="21" fill="transparent" stroke={colors[i%colors.length]} strokeWidth="8" strokeDasharray={dash} strokeDashoffset={offset}/>);return acc},{sum:0,nodes:[]}).nodes:<circle r="15.915" cx="21" cy="21" fill="transparent" stroke="#e2e8f0" strokeWidth="8"/>}</svg><div className="legend">{data.map((d,i)=><p key={d.name}><i style={{background:colors[i%colors.length]}}></i><b>{d.name}</b><span>{total?Math.round(d.value/total*100):0}% · {money.format(d.value)}</span></p>)}</div></div>}
function LineLike({data,field}){const max=Math.max(1,...data.map(d=>d[field])); const pts=data.map((d,i)=>`${(i/(Math.max(1,data.length-1))*100).toFixed(2)},${(100-d[field]/max*86-7).toFixed(2)}`).join(' '); return <div className="svgchart"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={pts} fill="none" stroke="#0284c7" strokeWidth="3" vectorEffect="non-scaling-stroke"/></svg></div>}
function BarLike({data,field}){const max=Math.max(1,...data.map(d=>d[field])); return <div className="bars">{data.map(d=><i key={d.day} style={{height:`${Math.max(2,d[field]/max*100)}%`}} title={`${d.day}: ${money.format(d[field])}`}></i>)}</div>}
function Story({id,label,total,cat,daily,max}){const top=topDay(daily);return <div className="story" id={id}><div className="storyin"><h4>Pig Pocket Monthly Stats</h4><h2>{label}</h2><section><span>每月累計支出</span><b>{money.format(total)}</b></section><div className="storygrid"><article><span>最大單項</span><b>{max?money.format(max.amount):money.format(0)}</b><small>{max?max.note||max.category:'未有支出'}</small></article><article><span>最高消費日</span><b>{top?.date||'-'}</b><small>{top?money.format(top.expense):'未有記錄'}</small></article></div><div className="storybars">{cat.slice(0,5).map((d,i)=><p key={d.name}><span>{d.name}</span><i><em style={{width:`${Math.max(5,total?d.value/total*100:0)}%`,background:colors[i%colors.length]}}></em></i><b>{total?Math.round(d.value/total*100):0}%</b></p>)}</div><footer>Powered by Pig Pocket 🐷</footer></div></div>}
function summary(txs){const ym=todayISO().slice(0,7);const m=txs.filter(t=>t.date?.startsWith(ym));const expense=sum(m,'expense'),income=sum(m,'income'),saving=sum(m,'saving');return{expense,income,saving,balance:income-expense-saving,today:sum(m.filter(t=>t.date===todayISO()),'expense'),rate:income?Math.round(saving/income*100):0,count:m.length}}
function sum(list,type){return list.filter(t=>t.type===type).reduce((a,b)=>a+b.amount,0)}
function ymOf(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function isoOf(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function calendarDays(month){const first=new Date(month.getFullYear(),month.getMonth(),1);const start=new Date(first);start.setDate(first.getDate()-first.getDay());return Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d})}
function aggregate(list,key){const m={};list.forEach(t=>m[t[key]||'其他']=(m[t[key]||'其他']||0)+t.amount);return Object.entries(m).map(([name,value])=>({name,value})).filter(d=>d.value>0)}
function dailyData(list,month){const n=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();return Array.from({length:n},(_,i)=>{const day=i+1,date=`${ymOf(month)}-${String(day).padStart(2,'0')}`;return{day,date,expense:list.filter(t=>t.date===date).reduce((a,b)=>a+b.amount,0)}})}
function dailyMaxData(list,month){const n=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();return Array.from({length:n},(_,i)=>{const day=i+1,date=`${ymOf(month)}-${String(day).padStart(2,'0')}`;const a=list.filter(t=>t.date===date).map(t=>t.amount);return{day,date,max:a.length?Math.max(...a):0}})}
function topDay(d){return [...d].sort((a,b)=>b.expense-a.expense)[0]}
async function downloadStory(id,filename){const el=document.getElementById(id);if(!el)return;const c=await html2canvas(el,{backgroundColor:null,scale:3,width:360,height:640});const out=document.createElement('canvas');out.width=1080;out.height=1920;out.getContext('2d').drawImage(c,0,0,1080,1920);out.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=filename;a.click()},'image/png')}
function csvOf(txs){return [['type','amount','category','payment','date','note'],...txs.map(t=>[t.type,t.amount,t.category,t.payment,t.date,t.note])].map(r=>r.map(x=>`"${String(x||'').replaceAll('"','""')}"`).join(',')).join('\n')}
function downloadBlob(text,filename,type){const b=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=filename;a.click()}

createRoot(document.getElementById('root')).render(<App/>)
