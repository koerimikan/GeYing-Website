import React, { useState, useEffect, useMemo } from 'react';
import { Save, Upload, Download, Search, Tag, Music, ExternalLink, RefreshCw } from 'lucide-react';
import logo from './assets/logo.png';

// --- 初始默认数据 (模拟 S3 官方列表) ---
const DEFAULT_SONGS = [
  { id: 's3-cn-01', title: '【S3】示例歌曲：极光', bv: 'BV1xxxxxx', group: 'CN', scores: { comp: 0, lyric: 0, tune: 0 }, tags: [], note: '' },
  { id: 's3-en-01', title: '【S3】Demo: Starlight', bv: 'BV2xxxxxx', group: 'EN', scores: { comp: 0, lyric: 0, tune: 0 }, tags: [], note: '' },
];

// --- 辅助函数：计算 S2/S3 加权分 ---
const calculateScore = (scores) => {
  const { comp, lyric, tune } = scores;
  // 排序：高 -> 低
  const sorted = [Number(comp), Number(lyric), Number(tune)].sort((a, b) => b - a);
  // 权重：最高分45%，次高30%，最低25%
  const weighted = (sorted[0] * 0.45) + (sorted[1] * 0.30) + (sorted[2] * 0.25);
  return weighted.toFixed(1); // 保留一位小数
};

export default function App() {
  // --- State ---
  const [songs, setSongs] = useState(() => {
    const saved = localStorage.getItem('shadowtrack-data');
    return saved ? JSON.parse(saved) : DEFAULT_SONGS;
  });
  const [filterText, setFilterText] = useState('');
  const [filterGroup, setFilterGroup] = useState('ALL'); // ALL, CN, EN

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('shadowtrack-data', JSON.stringify(songs));
  }, [songs]);

  // --- Handlers ---
  const handleScoreChange = (id, type, val) => {
    setSongs(prev => prev.map(s => 
      s.id === id ? { ...s, scores: { ...s.scores, [type]: val } } : s
    ));
  };

  const handleTagToggle = (id, tag) => {
    setSongs(prev => prev.map(s => {
      if (s.id !== id) return s;
      const newTags = s.tags.includes(tag) 
        ? s.tags.filter(t => t !== tag) 
        : [...s.tags, tag];
      return { ...s, tags: newTags };
    }));
  };

  const handleNoteChange = (id, text) => {
    setSongs(prev => prev.map(s => s.id === id ? { ...s, note: text } : s));
  };

  // 导出功能
  const exportData = () => {
    const blob = new Blob([JSON.stringify(songs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `s3-votes-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  // 导入功能
  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            setSongs(imported);
            alert('导入成功！');
          }
        } catch (err) {
          alert('文件格式错误');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // --- Render Helpers ---
  const filteredSongs = useMemo(() => {
    return songs.filter(s => {
      const matchesText = s.title.toLowerCase().includes(filterText.toLowerCase()) || s.id.includes(filterText);
      const matchesGroup = filterGroup === 'ALL' || s.group === filterGroup;
      return matchesText && matchesGroup;
    });
  }, [songs, filterText, filterGroup]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans selection:bg-cyan-500/30">
      {/* 背景光晕装饰 (纯CSS画的，不需要图片) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px]" />
      </div>
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          {/* Logo 图片 */}
          <img src={logo} alt="ShadowTrack Logo" className="w-12 h-12 object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              ShadowTrack S3
            </h1>
            <p className="text-slate-400 text-sm">歌影回战辅助投票台 (Unofficial)</p>
          </div>
        </div>
        {/* 右侧按钮保持不变 */}
        <div className="flex gap-2">
          <button onClick={importData} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition">
            <Upload size={16} /> 导入
          </button>
          <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition">
            <Save size={16} /> 备份数据
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="max-w-4xl mx-auto mb-8 bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="搜索歌曲 / BV号..." 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'CN', 'EN'].map(g => (
            <button 
              key={g}
              onClick={() => setFilterGroup(g)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterGroup === g ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {g === 'ALL' ? '全部' : g === 'CN' ? '中文组' : '外文组'}
            </button>
          ))}
        </div>
      </div>

      {/* Song List */}
      <div className="max-w-4xl mx-auto space-y-6">
        {filteredSongs.map(song => (
          <div key={song.id} className="group relative bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl transition-all hover:border-cyan-500/30 hover:shadow-cyan-500/10 hover:-translate-y-1">
            {/* 加上一个左侧的装饰条，根据组别变色 */}
            <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full transition-colors ${song.group === 'CN' ? 'bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.5)]'}`} />
            {/* Song Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${song.group === 'CN' ? 'bg-red-900/50 text-red-200' : 'bg-indigo-900/50 text-indigo-200'}`}>
                    {song.group}组
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{song.id}</span>
                </div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {song.title}
                  <a href={`https://www.bilibili.com/video/${song.bv}`} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-400">
                    <ExternalLink size={16} />
                  </a>
                </h3>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-400">{calculateScore(song.scores)}</div>
                <div className="text-xs text-slate-500">加权总分</div>
              </div>
            </div>

            {/* Scoring Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 bg-slate-950/50 p-4 rounded-lg">
              {['comp', 'lyric', 'tune'].map(type => (
                <div key={type} className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      {type === 'comp' ? '作曲 (曲)' : type === 'lyric' ? '作词 (词)' : '调校 (调)'}
                    </span>
                    <span className="font-mono font-bold text-slate-200">{song.scores[type]}</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={song.scores[type]}
                    onChange={(e) => handleScoreChange(song.id, type, parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Tags & Notes */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <textarea 
                  placeholder="听感备注 (Markdown)..."
                  className="w-full h-full min-h-[80px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition resize-none"
                  value={song.note}
                  onChange={(e) => handleNoteChange(song.id, e.target.value)}
                />
              </div>
              <div className="w-full md:w-48 flex flex-col gap-2">
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {['神调教', '良曲', '需重听', '歌词深奥'].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => handleTagToggle(song.id, tag)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition ${
                        song.tags.includes(tag) 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300' 
                        : 'bg-slate-800 border-transparent text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center text-slate-600 text-sm mt-12 mb-4">
        Created for UIUC IVORG & SongShadow War S3
      </div>
    </div>
  );
}