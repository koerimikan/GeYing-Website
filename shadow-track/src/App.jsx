import React, { useState, useEffect, useMemo } from 'react';
import { Save, Upload, Search, ExternalLink } from 'lucide-react';
import logo from './assets/logo.png';

const DEFAULT_SONGS = [
  { id: 's3-cn-01', title: '【S3】示例歌曲：极光', bv: 'BV1xxxxxx', group: 'CN', scores: { comp: 0, lyric: 0, tune: 0 }, tags: [], note: '' },
  { id: 's3-en-01', title: '【S3】Demo: Starlight', bv: 'BV2xxxxxx', group: 'EN', scores: { comp: 0, lyric: 0, tune: 0 }, tags: [], note: '' },
];

const calculateScore = (s) => {
  const sorted = [Number(s.comp), Number(s.lyric), Number(s.tune)].sort((a, b) => b - a);
  return (sorted[0] * 0.45 + sorted[1] * 0.30 + sorted[2] * 0.25).toFixed(1);
};

export default function App() {
  const [songs, setSongs] = useState(() => {
    const saved = localStorage.getItem('shadowtrack-v3');
    return saved ? JSON.parse(saved) : DEFAULT_SONGS;
  });
  const [filterText, setFilterText] = useState('');
  const [filterGroup, setFilterGroup] = useState('ALL');

  useEffect(() => localStorage.setItem('shadowtrack-v3', JSON.stringify(songs)), [songs]);

  const updateScore = (id, type, val) => setSongs(prev => prev.map(s => s.id === id ? { ...s, scores: { ...s.scores, [type]: val } } : s));
  const toggleTag = (id, tag) => setSongs(prev => prev.map(s => s.id === id ? { ...s, tags: s.tags.includes(tag) ? s.tags.filter(t => t !== tag) : [...s.tags, tag] } : s));
  const updateNote = (id, text) => setSongs(prev => prev.map(s => s.id === id ? { ...s, note: text } : s));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(songs, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `ST-S3-Backup-${new Date().toISOString().slice(5,10)}.json`; a.click();
  };

  const importData = () => {
    const el = document.createElement('input'); el.type = 'file';
    el.onchange = e => {
      const reader = new FileReader();
      reader.onload = ev => { try { setSongs(JSON.parse(ev.target.result)); } catch(err) { alert('JSON 格式不匹配'); } };
      reader.readAsText(e.target.files[0]);
    }; el.click();
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
          <img src={logo} alt="ST Logo" className="header-logo-img" />
          <div>
            <h1 className="header-title">ShadowTrack S3</h1>
            <p className="header-subtitle tracking-widest uppercase">Vocaloid Contest Assistant</p>
          </div>
        </div>
        <div className="flex gap-3">
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
                {g === 'ALL' ? '全部' : g === 'CN' ? '中文组' : '外文组'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="song-list-wrapper">
        {list.map(song => (
          <article key={song.id} className="song-card">
            <div className={`card-accent-bar ${song.group === 'CN' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]'}`} />
            
            <section className="card-header">
              <div>
                <span className="song-id-tag">{song.id} · {song.group === 'CN' ? '中文赛道' : '外文赛道'}</span>
                <h2 className="song-title">
                  {song.title}
                  <a href={`https://b23.tv/${song.bv}`} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-cyan-400 transition-colors"><ExternalLink size={20} /></a>
                </h2>
              </div>
              <div className="score-display">
                <span className="score-value">{calculateScore(song.scores)}</span>
                <span className="score-label">Weighted Score</span>
              </div>
            </section>

            <section className="sliders-layout">
              {[
                { k: 'comp', n: '作曲 (Composition)' },
                { k: 'lyric', n: '作词 (Lyrics)' },
                { k: 'tune', n: '调校 (Tuning)' }
              ].map(f => (
                <div key={f.k} className="slider-group">
                  <div className="slider-info">
                    <span className="slider-name">{f.n}</span>
                    <span className="slider-num">{song.scores[f.k]}</span>
                  </div>
                  <input type="range" min="0" max="100" value={song.scores[f.k]} onChange={e => updateScore(song.id, f.k, parseInt(e.target.value))} className="range-input" />
                </div>
              ))}
            </section>

            <section className="card-bottom-row">
              <div className="note-box">
                <textarea placeholder="输入听感笔记，支持 Markdown 格式..." className="note-area" value={song.note} onChange={e => updateNote(song.id, e.target.value)} />
              </div>
              <div className="tag-section">
                <span className="tag-label">快速标签</span>
                <div className="tag-grid">
                  {['神调教', '良曲', '需重听', '潜力股', '情感饱满'].map(t => (
                    <button key={t} onClick={() => toggleTag(song.id, t)} className={`btn-tag ${song.tags.includes(t) ? 'btn-tag-active' : 'btn-tag-inactive'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </article>
        ))}
      </main>

      <footer className="app-footer">
        UIUC IVORG · GeYing War S3 Assistant · 2026
      </footer>
    </div>
  );
}

// 补充一下缺少的按钮样式到 index.css 的最后
/*
.btn-tag-active { @apply bg-blue-600/20 border-blue-500/50 text-blue-300 px-3 py-1.5 rounded-lg text-xs border transition-all; }
.btn-tag-inactive { @apply bg-slate-800/50 border-white/5 text-slate-500 px-3 py-1.5 rounded-lg text-xs border hover:bg-slate-700 transition-all; }
*/