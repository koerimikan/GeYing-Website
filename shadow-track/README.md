# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

在合集播放界面使用脚本：
(function() {
    try {
        let episodes = [];
        const state = window.__INITIAL_STATE__;

        // 探测点 1: 合集 (Series/UGC Season) 结构
        if (state.videoData && state.videoData.ugc_season) {
            episodes = state.videoData.ugc_season.sections[0].episodes;
        } 
        // 探测点 2: 另一种常见的合集列表路径
        else if (state.sections && state.sections[0]) {
            episodes = state.sections[0].episodes;
        }
        // 探测点 3: 最后的备选路径
        else if (state.episodes) {
            episodes = state.episodes;
        }

        if (!episodes || episodes.length === 0) {
            throw new Error("未能探测到视频列表数据，请尝试在控制台手动输入 window.__INITIAL_STATE__ 并展开查看结构。");
        }

        // 转换为 ShadowTrack S3 需要的格式
        const songList = episodes.map((ep, index) => {
            const title = ep.title || ep.arc.title;
            return {
                id: `s2-${String(index + 1).padStart(3, '0')}`,
                title: title,
                bv: ep.bvid,
                // 根据 S2 惯例，包含 YC 字样的为中文组
                group: title.includes('YC') ? 'CN' : 'EN',
                scores: { comp: 0, lyric: 0, tune: 0 },
                tags: [],
                note: ''
            };
        });

        console.log(`✅ 成功探测到 ${songList.length} 首歌曲！`);
        console.log(JSON.stringify(songList, null, 2));
    } catch (e) {
        console.error("抓取失败: " + e.message);
    }
})();