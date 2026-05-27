import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Orbit, BarChart3, CalendarDays, Sparkles, Search, SlidersHorizontal, X, Edit3, Trash2, Share2, Download, Moon, Sun, ChevronLeft, MoreVertical, Save, Heart, Home, Briefcase, Users, Coins, Star, RefreshCcw, Settings, Upload, Image as ImageIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import html2canvas from 'html2canvas';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, parseISO } from 'date-fns';
import './styles.css';

const STORAGE='emotion-memory-v3';
const CUSTOM_IMAGE_STORAGE='emotion-memory-custom-emotion-images-v1';
const CUSTOM_LIBRARY_BG_STORAGE='emotion-memory-custom-library-bg-v1';
const makeId=()=> (typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
const cleanMemory=(m)=>({
  ...m,
  id:m.id||makeId(),
  title:m.title||'未命名情緒記憶',
  content:m.content||'',
  date:m.date||format(new Date(),'yyyy-MM-dd'),
  intensity:Number(m.intensity)||5,
  categories:Array.isArray(m.categories)?m.categories:[],
  images:[]
});

const EMOTIONS=[
  {key:'joy', zh:'喜悅', en:'Joy', emoji:'☀️', face:'😊', color:'#ffd34d', soft:'#fff0a8', gradient:'from-yellow-300 via-amber-400 to-orange-400', quote:'快樂不是擁有更多，而是珍惜已在身邊的一切。'},
  {key:'anger', zh:'憤怒', en:'Anger', emoji:'🔥', face:'😡', color:'#ff4b4b', soft:'#ffaaa5', gradient:'from-red-400 via-rose-500 to-orange-500', quote:'憤怒也在提醒你：有些界線需要被看見。'},
  {key:'sadness', zh:'悲傷', en:'Sadness', emoji:'💧', face:'🥺', color:'#52a7ff', soft:'#aed8ff', gradient:'from-sky-300 via-blue-500 to-indigo-500', quote:'悲傷不是退後，而是心正在慢慢整理自己。'},
  {key:'fear', zh:'恐懼', en:'Fear', emoji:'🫧', face:'😰', color:'#a66cff', soft:'#d7bcff', gradient:'from-violet-300 via-purple-500 to-fuchsia-500', quote:'害怕代表你很在乎，也代表你正在面對未知。'},
  {key:'disgust', zh:'厭惡', en:'Disgust', emoji:'🌿', face:'🙄', color:'#67e083', soft:'#b6ffc3', gradient:'from-emerald-300 via-green-500 to-lime-500', quote:'厭惡有時是一種直覺，提醒你選擇更適合自己的距離。'}
];
const CATEGORIES=[
  ['家庭',Home],['朋友',Users],['愛情',Heart],['事業',Briefcase],['金錢',Coins],['興趣',Star],['健康',Sparkles],['成長',Orbit],['學業',Edit3],['夢想',Moon]
];
const seed=[
  {id:'demo1', emotion:'joy', title:'很開心今天和家人一起吃飯', content:'今天和家人一起吃晚飯，大家聊得很開心，感覺很溫暖。', date:format(new Date(),'yyyy-MM-dd'), intensity:7, categories:['家庭','愛情'], createdAt:Date.now()-99999, images:[]},
  {id:'demo2', emotion:'fear', title:'工作壓力有點大', content:'新的任務讓我有點緊張，但我知道可以一步一步處理。', date:format(new Date(Date.now()-86400000*2),'yyyy-MM-dd'), intensity:6, categories:['事業','成長'], createdAt:Date.now()-888888, images:[]},
  {id:'demo3', emotion:'sadness', title:'想念一個人', content:'有些回憶忽然浮上來，心裡有點酸，但也很珍貴。', date:format(new Date(Date.now()-86400000*6),'yyyy-MM-dd'), intensity:5, categories:['朋友'], createdAt:Date.now()-777777, images:[]}
];
function useLocal(){
  const [items,setItems]=useState(()=>{
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE));
      const source=Array.isArray(raw)&&raw.length?raw:seed;
      return source.map(cleanMemory);
    }catch{
      return seed.map(cleanMemory);
    }
  });
  const [storageError,setStorageError]=useState('');
  useEffect(()=>{
    try{
      const safeItems=items.map(cleanMemory);
      localStorage.setItem(STORAGE,JSON.stringify(safeItems));
      setStorageError('');
    }catch(err){
      console.warn('Emotion Memory 儲存失敗。',err);
      setStorageError('本機儲存空間不足，請刪除部分舊記憶後再試。');
    }
  },[items]);
  return [items,setItems,storageError,setStorageError];
}

function compressEmotionImage(file,maxSize=420,quality=.86){
  return new Promise((resolve,reject)=>{
    if(!file || !file.type || !file.type.startsWith('image/')) return reject(new Error('請選擇圖片檔案。'));
    if(file.size>8*1024*1024) return reject(new Error('圖片太大，請選擇 8MB 以下圖片。'));
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('圖片讀取失敗。'));
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error('圖片格式未能讀取。'));
      img.onload=()=>{
        const scale=Math.min(1,maxSize/img.width,maxSize/img.height);
        const w=Math.max(1,Math.round(img.width*scale));
        const h=Math.max(1,Math.round(img.height*scale));
        const canvas=document.createElement('canvas');
        canvas.width=w; canvas.height=h;
        const ctx=canvas.getContext('2d');
        ctx.clearRect(0,0,w,h);
        ctx.drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL('image/webp',quality));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function useCustomEmotionImages(){
  const [customImages,setCustomImages]=useState(()=>{
    try{const raw=JSON.parse(localStorage.getItem(CUSTOM_IMAGE_STORAGE));return raw&&typeof raw==='object'?raw:{}}catch{return {}}
  });
  const [customImageError,setCustomImageError]=useState('');
  useEffect(()=>{
    try{localStorage.setItem(CUSTOM_IMAGE_STORAGE,JSON.stringify(customImages));setCustomImageError('')}
    catch(err){console.warn('自訂情緒圖片儲存失敗',err);setCustomImageError('圖片儲存空間不足，請先重設部分情緒圖片。')}
  },[customImages]);
  return [customImages,setCustomImages,customImageError,setCustomImageError];
}

function useCustomLibraryBg(){
  const [libraryBg,setLibraryBg]=useState(()=>{
    try{return localStorage.getItem(CUSTOM_LIBRARY_BG_STORAGE)||''}catch{return ''}
  });
  const [libraryBgError,setLibraryBgError]=useState('');
  useEffect(()=>{
    try{
      if(libraryBg){localStorage.setItem(CUSTOM_LIBRARY_BG_STORAGE,libraryBg)}
      else{localStorage.removeItem(CUSTOM_LIBRARY_BG_STORAGE)}
      setLibraryBgError('')
    }catch(err){
      console.warn('記憶庫背景儲存失敗',err);
      setLibraryBgError('背景圖片儲存空間不足，請改用較細圖片或重設背景。')
    }
  },[libraryBg]);
  return [libraryBg,setLibraryBg,libraryBgError,setLibraryBgError];
}

function EmotionAvatar({emotion,customImages,size='normal',className='',label}){
  const src=customImages?.[emotion.key];
  return <div className={`character emotion-avatar ${src?'has-custom':''} ${size==='small'?'small-avatar':''} ${className}`} style={bgStyle(emotion)} aria-label={label||emotion.zh}>
    {src?<img src={src} alt={emotion.zh}/>:<span>{emotion.face}</span>}
  </div>
}

function emotionOf(k){return EMOTIONS.find(e=>e.key===k)||EMOTIONS[0]}
function bgStyle(e){return {background:`radial-gradient(circle at 32% 28%, ${e.soft} 0, ${e.color} 35%, rgba(255,255,255,.2) 55%, ${e.color} 100%)`, boxShadow:`0 0 28px ${e.color}99, inset 0 8px 18px rgba(255,255,255,.42), inset 0 -12px 28px rgba(0,0,0,.2)`}}
function App(){const [items,setItems,storageError]=useLocal();const [customImages,setCustomImages,customImageError,setCustomImageError]=useCustomEmotionImages();const [libraryBg,setLibraryBg,libraryBgError,setLibraryBgError]=useCustomLibraryBg();const [tab,setTab]=useState('create');const [selected,setSelected]=useState(null);const [detail,setDetail]=useState(null);const [query,setQuery]=useState('');const [filter,setFilter]=useState('all');const [catFilter,setCatFilter]=useState('all');const [dark,setDark]=useState(true);
 const addMemory=(m)=>{const saved=cleanMemory({...m,id:makeId(),createdAt:Date.now()});setItems([saved,...items]);setSelected(null);setDetail(saved);setTimeout(()=>setTab('memories'),500)};
 const update=(m)=>setItems(items.map(x=>x.id===m.id?m:x)); const remove=(id)=>{setItems(items.filter(x=>x.id!==id));setDetail(null)};
 return <div className={`app ${dark?'dark':'light'}`}><Cosmos/><main className="phone-shell"><TopBar dark={dark} setDark={setDark}/><AnimatePresence mode="wait">
 {tab==='create'&&<Create key="create" onPick={setSelected} customImages={customImages}/>} {tab==='memories'&&<Memories key="mem" items={items} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} catFilter={catFilter} setCatFilter={setCatFilter} open={setDetail} customImages={customImages} libraryBg={libraryBg}/>} {tab==='stats'&&<Stats key="stats" items={items}/>} {tab==='calendar'&&<CalendarPage key="cal" items={items} open={setDetail} customImages={customImages}/>} {tab==='review'&&<Review key="rev" items={items} customImages={customImages}/>} {tab==='settings'&&<SettingsPage key="settings" customImages={customImages} setCustomImages={setCustomImages} error={customImageError} setError={setCustomImageError} libraryBg={libraryBg} setLibraryBg={setLibraryBg} libraryBgError={libraryBgError} setLibraryBgError={setLibraryBgError}/>} </AnimatePresence><Nav tab={tab} setTab={setTab}/></main>
 {(storageError||customImageError||libraryBgError)&&<div className="storage-warning">{storageError||customImageError||libraryBgError}</div>}<AnimatePresence>{selected&&<CreateModal emotion={selected} onClose={()=>setSelected(null)} onSave={addMemory} customImages={customImages}/>} {detail&&<Detail item={detail} onClose={()=>setDetail(null)} onDelete={remove} onSave={update} customImages={customImages}/>}</AnimatePresence></div>}
function Cosmos(){return <div className="cosmos"><div className="orb o1"/><div className="orb o2"/><div className="orb o3"/>{Array.from({length:34}).map((_,i)=><span key={i} className="star" style={{left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,animationDelay:`${Math.random()*8}s`}}/>)}</div>}
function TopBar({dark,setDark}){return <div className="topbar"><div><p className="mini">Emotion Memory</p><h1>情緒記憶宇宙</h1></div><button className="round" onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button></div>}
function Screen({children,className=''}){return <motion.section initial={{opacity:0,y:18,filter:'blur(10px)'}} animate={{opacity:1,y:0,filter:'blur(0px)'}} exit={{opacity:0,y:-12,filter:'blur(10px)'}} className={`screen ${className}`}>{children}</motion.section>}
function Create({onPick,customImages}){
 const topEmotions=EMOTIONS.slice(0,2);
 const bottomEmotions=EMOTIONS.slice(2);
 const renderEmotion=(e,i)=><motion.button key={e.key} className={`emotion-mascot emotion-${e.key}`} onClick={()=>onPick(e)} whileTap={{scale:.92}} animate={{y:[0,-10,0]}} transition={{duration:3+i*.24,repeat:Infinity}} aria-label={e.zh}><EmotionAvatar emotion={e} customImages={customImages}/></motion.button>;
 return <Screen><div className="hero"><p className="label">每段回憶，都值得被收藏。</p><h2>今天，<br/>你留下了什麼情緒？</h2><p>選一個最貼近你的情緒，將它變成一顆會發光的記憶球。</p></div><div className="emotion-stage"><div className="emotion-stage-row emotion-stage-top">{topEmotions.map((e,i)=>renderEmotion(e,i))}</div><div className="emotion-stage-row emotion-stage-bottom">{bottomEmotions.map((e,i)=>renderEmotion(e,i+2))}</div></div><div className="tip-card"><Sparkles size={18}/><div><b>小提示</b><p>不需要寫得完美，只要誠實記下此刻感覺就很好。可到「設定」上載圖片，自訂 5 種情緒公仔形象。</p></div></div></Screen>}
function CreateModal({emotion,onClose,onSave,customImages}){
 const [title,setTitle]=useState('');
 const [content,setContent]=useState('');
 const [date,setDate]=useState(format(new Date(),'yyyy-MM-dd'));
 const [intensity,setIntensity]=useState(7);
 const [cats,setCats]=useState([]);
 const toggle=c=>setCats(cats.includes(c)?cats.filter(x=>x!==c):[...cats,c]);
 const save=()=>{
   onSave({emotion:emotion.key,title:title||'未命名情緒記憶',content:content||'這是一段值得收藏的情緒。',date,intensity,categories:cats,images:[]});
 };
 return <motion.div className="overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
  <motion.div className="create-modal" initial={{y:60,scale:.95}} animate={{y:0,scale:1}} exit={{y:80,scale:.95}}>
   <div className={`modal-head bg-gradient-to-br ${emotion.gradient}`}>
    <EmotionAvatar emotion={emotion} customImages={customImages} size="small" className="mini-character"/><div><h3>{emotion.zh}</h3><p>{emotion.en}</p></div><button onClick={onClose}><X size={20}/></button>
   </div>
   <div className="form">
    <label>記憶標題<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="今天發生了什麼讓你印象深刻？"/></label>
    <label>記憶內容<textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="寫下你的感受與回憶..."/></label>
    <div className="row"><label>日期<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>情緒強度 <span>{intensity}/10</span><input type="range" min="1" max="10" value={intensity} onChange={e=>setIntensity(+e.target.value)}/></label></div>
    <p className="field-title">分類（可多選）</p><div className="chips">{CATEGORIES.map(([c,Icon])=><button type="button" key={c} className={cats.includes(c)?'chip active':'chip'} onClick={()=>toggle(c)}><Icon size={14}/>{c}</button>)}</div>
    <button className="primary" onClick={save}><Save size={18}/>保存記憶球</button>
   </div>
  </motion.div>
 </motion.div>
}
function Memories({items,query,setQuery,filter,setFilter,catFilter,setCatFilter,open,customImages,libraryBg}){
 const filtered=items.filter(m=>{const t=(m.title+m.content+m.categories.join('')).toLowerCase();return (filter==='all'||m.emotion===filter)&&(catFilter==='all'||m.categories.includes(catFilter))&&t.includes(query.toLowerCase())});
 const todayCount=items.filter(m=>isSameDay(parseISO(m.date),new Date())).length;
 const mostEmotion=EMOTIONS.map(e=>({e,count:items.filter(i=>i.emotion===e.key).length})).sort((a,b)=>b.count-a.count)[0]?.e||EMOTIONS[0];
 const recent=items[0]||null;
 const activeEmotion=filter==='all'?null:emotionOf(filter);
 const librarySlots=[
  {left:'25%',top:'20%',size:88,delay:0},{left:'47%',top:'18%',size:64,delay:.2},{left:'67%',top:'21%',size:78,delay:.4},
  {left:'19%',top:'36%',size:68,delay:.6},{left:'40%',top:'35%',size:104,delay:.8},{left:'63%',top:'37%',size:74,delay:1},{left:'79%',top:'35%',size:58,delay:1.2},
  {left:'25%',top:'53%',size:92,delay:1.4},{left:'50%',top:'52%',size:72,delay:1.6},{left:'70%',top:'54%',size:94,delay:1.8},
  {left:'19%',top:'70%',size:64,delay:2},{left:'39%',top:'71%',size:80,delay:2.2},{left:'59%',top:'70%',size:62,delay:2.4},{left:'77%',top:'71%',size:78,delay:2.6}
 ];
 const memoryPool=filtered;
 const backgroundValue=libraryBg?`url(${libraryBg})`:`url('/assets/memory-library-bg.jpeg')`;
 return <Screen className="library-screen v16-library-screen compact-library-screen">
  <div className="library-top v16-library-top no-left-title"><div></div><div className="library-tools"><button aria-label="搜尋"><Search size={20}/></button><button aria-label="篩選"><SlidersHorizontal size={19}/></button><button onClick={()=>setFilter('all')}>全部</button></div></div>
  <div className="library-search v16-library-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜尋標題、內容、分類..."/><select value={catFilter} onChange={e=>setCatFilter(e.target.value)}><option value="all">全部分類</option>{CATEGORIES.map(([c])=><option key={c}>{c}</option>)}</select></div>
  <div className="memory-library-stage v16-memory-library-stage compact-memory-library-stage" style={{'--libraryBg':backgroundValue}}>
   <div className="v16-bg-dim compact-bg-dim"/>
   <div className="emotion-side-nav v16-emotion-side-nav compact-emotion-side-nav">{EMOTIONS.map((e,i)=><motion.button key={e.key} onClick={()=>setFilter(filter===e.key?'all':e.key)} className={filter===e.key?'active':''} style={{'--emotionColor':e.color}} whileTap={{scale:.92}} animate={{y:[0,-4,0]}} transition={{duration:2.2+i*.18,repeat:Infinity}} aria-label={`查看${e.zh}記憶`}>{customImages?.[e.key]?<img src={customImages[e.key]} alt={e.zh}/>:<span>{e.face}</span>}</motion.button>)}</div>
   <div className="v16-sparkle-layer"><i/><i/><i/><i/><i/></div>
   {memoryPool.length===0?<div className="library-empty v16-library-empty compact-library-empty"><Sparkles/><b>未有相關記憶</b><p>試試切換其他情緒，或到創建頁新增第一顆記憶水晶。</p></div>:memoryPool.slice(0,librarySlots.length).map((m,i)=>{const slot=librarySlots[i];const e=emotionOf(m.emotion);return <motion.button key={m.id} className="library-crystal v16-library-crystal compact-library-crystal" style={{left:slot.left,top:slot.top,width:slot.size,height:slot.size,'--orb':e.color,'--orbSoft':e.soft}} onClick={()=>open(m)} animate={{y:[0,-8-(i%3)*3,0],scale:[1,1.035,1]}} transition={{duration:4.2+slot.delay,repeat:Infinity,ease:'easeInOut'}}><span>{m.title}</span><small>{customImages?.[e.key]?<img src={customImages[e.key]} alt={e.zh}/>:e.face}</small></motion.button>})}
   <div className="library-stat-card v16-library-stat-card compact-stat-card"><span>記憶總數</span><b>{items.length}</b><small>今日新增 {todayCount}<br/>最常：{mostEmotion.zh}</small></div>
   <div className="library-recent-card v16-library-recent-card compact-recent-card"><span>最近新增</span><b>{recent?recent.title:'未有記憶'}</b><small>{recent?recent.date:'到創建頁新增'}</small></div>
  </div>
 </Screen>}
function Empty(){return <div className="empty"><div className="character small">✨</div><h3>未有記憶球</h3><p>返回創建頁，收藏第一份情緒吧。</p></div>}
function Detail({item,onClose,onDelete,onSave,customImages}){const e=emotionOf(item.emotion);const cardRef=useRef(null);const exportImg=async()=>{if(!cardRef.current)return;const canvas=await html2canvas(cardRef.current,{backgroundColor:null,scale:2});const a=document.createElement('a');a.href=canvas.toDataURL();a.download=`emotion-memory-${item.date}.png`;a.click()};return <motion.div className="overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.div className="detail" initial={{y:70}} animate={{y:0}} exit={{y:80}} ref={cardRef}><div className="detail-top"><button onClick={onClose}><ChevronLeft/></button><button><MoreVertical/></button></div><div className="big-ball" style={bgStyle(e)}>{customImages?.[e.key]?<img className="big-custom-face" src={customImages[e.key]} alt={e.zh}/>:<span>{e.face}</span>}<b>{item.title}</b><i>♥</i></div><div className="detail-card"><div className="between"><div><h3>{e.zh}</h3><p>{e.en}</p></div><p>{item.date}</p></div><p className="content">{item.content}</p><div className="stars">{'★'.repeat(item.intensity)}{'☆'.repeat(10-item.intensity)} <span>{item.intensity}/10</span></div><div className="chips">{(item.categories||[]).map(c=><span className="chip active" key={c}>{c}</span>)}</div></div><div className="actions"><button><Edit3/>編輯</button><button onClick={exportImg}><Download/>匯出</button><button onClick={()=>onDelete(item.id)} className="danger"><Trash2/>刪除</button></div></motion.div></motion.div>}
function Stats({items}){const counts=EMOTIONS.map(e=>({name:e.zh,value:items.filter(i=>i.emotion===e.key).length,color:e.color}));const total=items.length||1;const avg=(items.reduce((s,i)=>s+i.intensity,0)/(items.length||1)).toFixed(1);const line=items.slice().reverse().map((i,idx)=>({name:String(idx+1),v:i.intensity}));return <Screen><div className="page-head"><h2>情緒統計</h2><BarChart3/></div><div className="stats-card"><ResponsiveContainer width="100%" height={210}><PieChart><Pie data={counts} dataKey="value" innerRadius={54} outerRadius={82} paddingAngle={4}>{counts.map((c,i)=><Cell key={i} fill={c.color}/>)}</Pie></PieChart></ResponsiveContainer><div className="center-number"><b>{items.length}</b><span>記憶球</span></div></div><div className="legend">{counts.map(c=><p key={c.name}><i style={{background:c.color}}/> {c.name}<span>{Math.round(c.value/total*100)}%</span></p>)}</div><div className="chart-card"><div className="between"><h3>情緒趨勢</h3><b>平均強度 {avg}/10</b></div><ResponsiveContainer width="100%" height={170}><LineChart data={line}><XAxis dataKey="name" hide/><YAxis hide domain={[0,10]}/><Tooltip/><Line type="monotone" dataKey="v" stroke="#6ee7ff" strokeWidth={3} dot={{r:4}}/></LineChart></ResponsiveContainer></div></Screen>}
function CalendarPage({items,open,customImages}){
 const [viewMonth,setViewMonth]=useState(new Date());
 const safeDate=(value)=>{try{return parseISO(value)}catch{return new Date()}};
 const changeMonth=(step)=>setViewMonth(prev=>new Date(prev.getFullYear(),prev.getMonth()+step,1));
 const goToday=()=>setViewMonth(new Date());
 const days=eachDayOfInterval({start:startOfMonth(viewMonth),end:endOfMonth(viewMonth)});
 const offset=getDay(days[0]);
 const monthItems=items.filter(m=>{const d=safeDate(m.date);return d.getFullYear()===viewMonth.getFullYear()&&d.getMonth()===viewMonth.getMonth()});
 const selectedIsCurrentMonth=viewMonth.getFullYear()===new Date().getFullYear()&&viewMonth.getMonth()===new Date().getMonth();
 return <Screen>
  <div className="page-head"><h2>情緒日曆</h2><button className="icon-btn" onClick={()=>changeMonth(1)} title="查看下一個月份"><CalendarDays size={20}/></button></div>
  <div className="calendar-card">
   <div className="month-switch">
    <button onClick={()=>changeMonth(-1)} aria-label="上一個月"><ChevronLeft size={20}/></button>
    <button className="month-title" onClick={goToday} title="返回本月">{format(viewMonth,'yyyy年M月')}</button>
    <button onClick={()=>changeMonth(1)} aria-label="下一個月"><ChevronLeft size={20} className="flip"/></button>
   </div>
   <p className="month-summary">{selectedIsCurrentMonth?'本月':format(viewMonth,'yyyy年M月')}共有 {monthItems.length} 份情緒記憶</p>
   <div className="week">{'日一二三四五六'.split('').map(d=><span key={d}>{d}</span>)}</div>
   <div className="days">{Array.from({length:offset}).map((_,i)=><span key={'b'+i}/>) }{days.map(d=>{const ms=items.filter(m=>isSameDay(safeDate(m.date),d));return <button key={d.toISOString()} className={isSameDay(d,new Date())?'today':''} onClick={()=>ms[0]&&open(ms[0])}><b>{format(d,'d')}</b>{ms.slice(0,3).map(m=><i key={m.id} style={{background:emotionOf(m.emotion).color}}/>)}{ms.length>3&&<em>+{ms.length-3}</em>}</button>})}</div>
  </div>
  <div className="today-list"><h3>{format(viewMonth,'M月')}情緒紀錄</h3>{monthItems.length?monthItems.map(m=><button key={m.id} onClick={()=>open(m)}><span style={bgStyle(emotionOf(m.emotion))}>{customImages?.[m.emotion]?<img className="list-custom-face" src={customImages[m.emotion]} alt={emotionOf(m.emotion).zh}/>:emotionOf(m.emotion).face}</span><div><b>{m.title}</b><p>{m.date} · {m.content}</p></div></button>):<div className="empty small-empty"><div className="character small">🌙</div><h3>這個月份未有紀錄</h3><p>可以用左右箭嘴翻看其他月份。</p></div>}</div>
 </Screen>}
function Review({items,customImages}){const today=items.filter(m=>isSameDay(parseISO(m.date),new Date()));const main=today[0]||items[0]||seed[0];const e=emotionOf(main.emotion);return <Screen><div className="page-head"><h2>今日回顧</h2><RefreshCcw/></div><div className={`review-hero bg-gradient-to-br ${e.gradient}`}><EmotionAvatar emotion={e} customImages={customImages}/><div><p>你的主要情緒</p><h2>{e.zh}</h2><b>{main.intensity}/10</b></div></div><div className="quote-card"><h3>今日語錄</h3><p>「{e.quote}」</p></div><div className="quote-card"><h3>今日分析</h3><p>今天共收藏 {today.length} 份情緒記憶。把情緒寫下來，本身已經是一種溫柔整理。</p></div><button className="primary"><Share2 size={18}/>分享今天的心情</button></Screen>}

function SettingsPage({customImages,setCustomImages,error,setError,libraryBg,setLibraryBg,libraryBgError,setLibraryBgError}){
 const [busy,setBusy]=useState('');
 const [bgBusy,setBgBusy]=useState(false);
 const pickLibraryBg=async(file)=>{
   if(!file)return;
   setBgBusy(true);
   setLibraryBgError('');
   try{
     const dataUrl=await compressEmotionImage(file,1280,.78);
     setLibraryBg(dataUrl);
   }catch(err){setLibraryBgError(err.message||'背景圖片處理失敗，請重試。')}
   finally{setBgBusy(false)}
 };
 const pick=async(emotion,file)=>{
   if(!file)return;
   setBusy(emotion.key);
   setError('');
   try{
     const dataUrl=await compressEmotionImage(file,420,.86);
     setCustomImages(prev=>({...prev,[emotion.key]:dataUrl}));
   }catch(err){setError(err.message||'圖片處理失敗，請重試。')}
   finally{setBusy('')}
 };
 const resetOne=(key)=>setCustomImages(prev=>{const next={...prev};delete next[key];return next});
 const resetAll=()=>setCustomImages({});
 return <Screen className="settings-screen">
   <div className="page-head"><h2>情緒公仔設定</h2><Settings size={20}/></div>
   <div className="settings-hero"><ImageIcon size={24}/><div><b>自訂記憶庫背景</b><p>建議使用直向手機背景圖，尺寸約 1080 × 1920 px 或 1170 × 2532 px；主體盡量放中間，右邊預留位置給 5 個情緒按鍵。</p></div></div>
   <div className="library-bg-setting-card">
     <div className="library-bg-preview" style={{backgroundImage:libraryBg?`url(${libraryBg})`:`url('/assets/memory-library-bg.jpeg')`}}><span>{libraryBg?'自訂背景':'預設背景'}</span></div>
     <div className="library-bg-actions">
       <label className="asset-upload"><Upload size={15}/>{bgBusy?'處理中...':'上載背景'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={bgBusy} onChange={ev=>pickLibraryBg(ev.target.files?.[0])}/></label>
       {libraryBg&&<button className="asset-reset" onClick={()=>setLibraryBg('')}>還原預設背景</button>}
     </div>
   </div>
   {(libraryBgError)&&<p className="image-error">{libraryBgError}</p>}
   <div className="settings-hero"><ImageIcon size={24}/><div><b>自訂 5 種情緒插圖</b><p>上載 PNG / JPG / WebP，系統會自動壓縮並儲存在本機。創建頁、記憶球詳情、日曆及回顧會同步使用。</p></div></div>
   {error&&<p className="image-error">{error}</p>}
   <div className="asset-grid">{EMOTIONS.map(e=><div className="asset-card" key={e.key}>
     <div className="asset-preview" style={bgStyle(e)}>{customImages?.[e.key]?<img src={customImages[e.key]} alt={e.zh}/>:<span>{e.face}</span>}</div>
     <div className="asset-info"><b>{e.zh}</b><small>{e.en}</small><em style={{color:e.color}}>{e.color}</em></div>
     <label className="asset-upload"><Upload size={15}/>{busy===e.key?'處理中...':'上載圖片'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy===e.key} onChange={ev=>pick(e,ev.target.files?.[0])}/></label>
     {customImages?.[e.key]&&<button className="asset-reset" onClick={()=>resetOne(e.key)}>還原預設</button>}
   </div>)}</div>
   <button className="secondary-wide" onClick={resetAll}>重設全部情緒公仔</button>
   <div className="tip-card"><Sparkles size={18}/><div><b>建議圖片</b><p>使用透明背景 PNG 或正方形角色圖效果最好。圖片只會保存在你的瀏覽器，不會上傳到伺服器。</p></div></div>
 </Screen>
}
function Nav({tab,setTab}){const nav=[['create','創建',Plus],['memories','記憶集',Orbit],['stats','統計',BarChart3],['calendar','日曆',CalendarDays],['review','回顧',Sparkles],['settings','設定',Settings]];return <nav className="nav nav-six">{nav.map(([k,t,Icon])=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}><Icon size={18}/><span>{t}</span></button>)}</nav>}

createRoot(document.getElementById('root')).render(<App/>);
