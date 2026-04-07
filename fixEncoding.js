const fs = require('fs');

const replaces = [
  {
    file: 'pages/ProductDetail.tsx',
    subs: [
      { from: 'ä¸ºæ­¤è®¾å¤‡æŽ¨è  ', to: '为此设备推荐' },
      { from: 'åŸºäºŽè¯¥è®¾å¤‡è¿‘æœŸæµ è§ˆçš„äº§å“ ä¸Žèµ„è®¯è¡Œä¸ºã€‚', to: '基于该设备近期浏览的产品与资讯行为。' },
      { from: 'æµ è§ˆç›®å½•', to: '浏览目录' }
    ]
  },
  {
    file: 'pages/NewsDetail.tsx',
    subs: [
      { from: 'ä¸ºæ­¤è®¾å¤‡æŽ¨è  çš„èµ„è®¯', to: '为此设备推荐的资讯' }
    ]
  },
  {
    file: 'pages/Home.tsx',
    subs: [
      { from: 'ä¸ºæ­¤è®¾å¤‡æŽ¨è  ', to: '为此设备推荐' },
      { from: 'ç»“å ˆè¯¥è®¾å¤‡è¿‘æœŸæµ è§ˆçš„äº§å“ ã€åˆ†ç±»ä¸Žå¸‚åœºèµ„è®¯ä¿¡å ·åŠ¨æ€ è°ƒæ•´ã€‚', to: '结合该设备近期浏览的产品、分类与市场资讯信号动态调整。' }
    ]
  },
  {
    file: 'App.tsx',
    subs: [
      { from: 'æ­£åœ¨åŠ è½½äº’åŠ¨åœ°å›¾...', to: '正在加载互动地图...' }
    ]
  }
];

for (const task of replaces) {
  let content = fs.readFileSync(task.file, 'utf8');
  for (const sub of task.subs) {
    content = content.replace(new RegExp(sub.from, 'g'), sub.to);
  }
  fs.writeFileSync(task.file, content, 'utf8');
  console.log('Fixed', task.file);
}
