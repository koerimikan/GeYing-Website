import React, { useState, useEffect, useMemo } from 'react';
import { Save, Upload, Search, ExternalLink, X, RotateCcw } from 'lucide-react'; // 补全了图标
import logo from './assets/logo.png';
import { DEFAULT_SONGS } from './data/songs';


const calculateScore = (s) => {
  const sorted = [Number(s.comp), Number(s.lyric), Number(s.tune)].sort((a, b) => b - a);
  return (sorted[0] * 0.45 + sorted[1] * 0.30 + sorted[2] * 0.25).toFixed(1);
};

export default function App() {
  // --- 状态管理 ---
  const [songs, setSongs] = useState(() => {
    const saved = localStorage.getItem('shadowtrack-v3');
    // 如果之前存的数据格式有问题，可能会导致白屏，这里加个容错
    try {
      return saved ? JSON.parse(saved) : DEFAULT_SONGS;
    } catch (e) {
      return DEFAULT_SONGS;
    }
  });
  const [filterText, setFilterText] = useState('');
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [activeBv, setActiveBv] = useState(null); 
  
  // 拖拽位置状态
  const [playerPos, setPlayerPos] = useState({ x: 100, y: 100 });

  useEffect(() => localStorage.setItem('shadowtrack-v3', JSON.stringify(songs)), [songs]);

  // --- 逻辑函数 ---
  const updateScore = (id, type, val) => setSongs(prev => prev.map(s => s.id === id ? { ...s, scores: { ...s.scores, [type]: val } } : s));
  const toggleTag = (id, tag) => setSongs(prev => prev.map(s => s.id === id ? { ...s, tags: s.tags.includes(tag) ? s.tags.filter(t => t !== tag) : [...s.tags, tag] } : s));
  const updateNote = (id, text) => setSongs(prev => prev.map(s => s.id === id ? { ...s, note: text } : s));

  const resetToDefault = () => {
    if (window.confirm("确定要重置所有数据吗？")) {
      setSongs(DEFAULT_SONGS);
      localStorage.removeItem('shadowtrack-v3');
      setActiveBv(null);
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(songs, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `ST-Backup-${new Date().toISOString().slice(5,10)}.json`; a.click();
  };

  const importData = () => {
    const el = document.createElement('input'); el.type = 'file';
    el.onchange = e => {
      const reader = new FileReader();
      reader.onload = ev => { try { setSongs(JSON.parse(ev.target.result)); } catch(err) { alert('格式错误'); } };
      reader.readAsText(e.target.files[0]);
    }; el.click();
  };

  // --- 拖拽处理逻辑 ---
  const handleMouseDown = (e) => {
    const startX = e.clientX - playerPos.x;
    const startY = e.clientY - playerPos.y;
    
    const handleMouseMove = (moveEvent) => {
      setPlayerPos({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const list = useMemo(() => songs.filter(s => 
    (s.title.toLowerCase().includes(filterText.toLowerCase()) || s.id.includes(filterText)) && 
    (filterGroup === 'ALL' || s.group === filterGroup)
  ), [songs, filterText, filterGroup]);

  return (
    <div className="app-wrapper">
      <div className="bg-glow-container">
        <div className="bg-glow-purple" />
        <div className="bg-glow-cyan" />
      </div>

      <header className="header-section">
        <div className="header-logo-block">
          <img src={logo} alt="Logo" className="header-logo-img" />
          <div>
            <h1 className="header-title">ShadowTrack S3</h1>
            <p className="header-subtitle tracking-widest uppercase">Vocaloid Contest Assistant</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={resetToDefault} className="btn-secondary text-red-400"><RotateCcw size={18} /> 重置</button>
          <button onClick={importData} className="btn-secondary"><Upload size={18} /> 导入</button>
          <button onClick={exportData} className="btn-primary"><Save size={18} /> 备份数据</button>
        </div>
      </header>

      <div className="control-bar-wrapper">
        <div className="control-bar">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input type="text" placeholder="搜索曲名、ID、BV号..." className="search-input" value={filterText} onChange={e => setFilterText(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {['ALL', 'CN', 'EN'].map(g => (
              <button key={g} onClick={() => setFilterGroup(g)} className={`btn-filter ${filterGroup === g ? 'active' : ''}`}>
                {g === 'ALL' ? '全部' : g === 'CN' ? '中文' : '外文'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 悬浮可拖拽缩放播放器 */}
      {activeBv && (
        <section 
          className="player-floating-wrapper"
          style={{ left: `${playerPos.x}px`, top: `${playerPos.y}px` }}
        >
          <div className="player-header cursor-move select-none" onMouseDown={handleMouseDown}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400">正在播放: {activeBv}</span>
            </div>
            <button onClick={() => setActiveBv(null)} className="hover:text-white transition-colors"><X size={16} /></button>
          </div>
          <div className="flex-1 w-full bg-black relative">
            <iframe 
              src={`//player.bilibili.com/player.html?bvid=${activeBv}&page=1&high_quality=1&danmaku=0`} 
              className="w-full h-full pointer-events-auto"
              allowFullScreen
              frameBorder="0"
            />
          </div>
          <div className="player-resizer-handle" />
        </section>
      )}

      <main className="song-list-wrapper">
        {list.map(song => (
          <article key={song.id} className="song-card group">
            <div className={`card-accent-bar ${song.group === 'CN' ? 'bg-red-500' : 'bg-cyan-500'}`} />
            <section className="card-header">
              <div>
                <span className="song-id-tag">{song.id} · {song.group === 'CN' ? '中文赛道' : '外文赛道'}</span>
                <h2 className="song-title cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => setActiveBv(song.bv)}>
                  {song.title}
                  <a href={`https://b23.tv/${song.bv}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-slate-600 ml-2"><ExternalLink size={20} /></a>
                </h2>
              </div>
              <div className="score-display">
                <span className="score-value">{calculateScore(song.scores)}</span>
                <span className="score-label">Weighted Score</span>
              </div>
            </section>

            <section className="sliders-layout">
              {['comp', 'lyric', 'tune'].map(k => (
                <div key={k} className="slider-group">
                  <div className="slider-info">
                    <span className="slider-name">{k === 'comp' ? '作曲' : k === 'lyric' ? '作词' : '调校'}</span>
                    <span className="slider-num">{song.scores[k]}</span>
                  </div>
                  <input type="range" min="0" max="100" value={song.scores[k]} onChange={e => updateScore(song.id, k, parseInt(e.target.value))} className="range-input" />
                </div>
              ))}
            </section>

            <section className="card-bottom-row">
              <textarea placeholder="输入听感笔记..." className="note-area" value={song.note} onChange={e => updateNote(song.id, e.target.value)} />
              <div className="tag-section">
                <div className="tag-grid">
                  {['神调教', '良曲', '需重听', '潜力股', '情感饱满'].map(t => (
                    <button key={t} onClick={() => toggleTag(song.id, t)} className={song.tags.includes(t) ? 'btn-tag-active' : 'btn-tag-inactive'}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </article>
        ))}
      </main>

      <footer className="app-footer">UIUC IVORG · GeYing S3 · 2026</footer>
    </div>
  );
}