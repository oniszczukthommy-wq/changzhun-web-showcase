export type SuggestedSong = { id: string; title: string; artist: string };
export type Playlist = { id: string; title: string; subtitle: string; tag: string; color: string; songs: SuggestedSong[] };
const list = (id: string, title: string, subtitle: string, tag: string, color: string, tracks: string): Playlist => ({
  id, title, subtitle, tag, color,
  songs: tracks.split("\n").filter(Boolean).map(row => { const [title, artist] = row.split(" / "); return { id: `${artist}—${title}`, title, artist }; }),
});
/** Editorial recommendations; song metadata only, with no bundled audio or lyrics. */
export const PLAYLISTS: Playlist[] = [
  list("first", "从熟悉的旋律开始", "不赶进度，先找到自然的声音", "入门练唱", "#a78bfa", `月亮代表我的心 / 邓丽君
甜蜜蜜 / 邓丽君
小城故事 / 邓丽君
外婆的澎湖湾 / 潘安邦
童年 / 罗大佑
兰花草 / 银霞
橄榄树 / 齐豫
朋友 / 周华健
同桌的你 / 老狼
送别 / 朴树`),
  list("classics", "华语经典，开口就会", "那些一直记在心里的歌", "经典金曲", "#f4b76f", `吻别 / 张学友
忘情水 / 刘德华
爱如潮水 / 张信哲
我愿意 / 王菲
听海 / 张惠妹
至少还有你 / 林忆莲
后来 / 刘若英
勇气 / 梁静茹
爱很简单 / 陶喆
你怎么舍得我难过 / 黄品源`),
  list("jay", "周杰伦的青春旋律", "从轻声叙述到副歌里的情绪", "歌手精选", "#7f9ad8", `晴天 / 周杰伦
稻香 / 周杰伦
简单爱 / 周杰伦
安静 / 周杰伦
七里香 / 周杰伦
蒲公英的约定 / 周杰伦
告白气球 / 周杰伦
最长的电影 / 周杰伦
搁浅 / 周杰伦
说好的幸福呢 / 周杰伦`),
  list("female", "女声里的细腻表达", "把每一句唱得清楚，也唱得温柔", "女声抒情", "#e6a0c4", `遇见 / 孙燕姿
开始懂了 / 孙燕姿
红豆 / 王菲
旋木 / 王菲
隐形的翅膀 / 张韶涵
遗失的美好 / 张韶涵
可惜不是你 / 梁静茹
暖暖 / 梁静茹
亲爱的，那不是爱情 / 张韶涵
旅行的意义 / 陈绮贞`),
  list("male", "男声慢歌，慢慢唱", "留意句尾，让声音平稳地落下", "男声抒情", "#79b4c6", `十年 / 陈奕迅
好久不见 / 陈奕迅
爱情转移 / 陈奕迅
淘汰 / 陈奕迅
突然好想你 / 五月天
温柔 / 五月天
知足 / 五月天
我不愿让你一个人 / 五月天
说谎 / 林宥嘉
那些你很冒险的梦 / 林俊杰`),
  list("folk", "民谣与一把吉他", "顺着歌词，讲完一个故事", "民谣时光", "#b0bd88", `成都 / 赵雷
南方姑娘 / 赵雷
画 / 赵雷
理想 / 赵雷
安和桥 / 宋冬野
斑马，斑马 / 宋冬野
董小姐 / 宋冬野
南山南 / 马頔
平凡之路 / 朴树
那些花儿 / 朴树`),
  list("cantonese", "粤语金曲，越唱越有味", "留心咬字和旋律的连接", "粤语歌单", "#c5a279", `海阔天空 / Beyond
光辉岁月 / Beyond
喜欢你 / Beyond
红日 / 李克勤
月半小夜曲 / 李克勤
千千阙歌 / 陈慧娴
一生所爱 / 卢冠廷
富士山下 / 陈奕迅
喜帖街 / 谢安琪
遥远的她 / 张学友`),
  list("chinese", "国风里的婉转旋律", "跟着旋律，练习柔和的转音", "国风精选", "#b9a2d4", `青花瓷 / 周杰伦
东风破 / 周杰伦
发如雪 / 周杰伦
千里之外 / 周杰伦、费玉清
江南 / 林俊杰
醉赤壁 / 林俊杰
曹操 / 林俊杰
庐州月 / 许嵩
清明雨上 / 许嵩
半城烟沙 / 许嵩`),
  list("ktv", "下一次 KTV 就唱这些", "把喜欢的副歌练得更熟", "聚会必唱", "#dd8e80", `小幸运 / 田馥甄
倒带 / 蔡依林
日不落 / 蔡依林
恋爱ing / 五月天
倔强 / 五月天
修炼爱情 / 林俊杰
演员 / 薛之谦
绅士 / 薛之谦
情非得已 / 庾澄庆
突然的自我 / 伍佰`),
  list("new", "这些年的华语流行", "找一首最近想唱的歌", "流行精选", "#87bcae", `起风了 / 买辣椒也用券
年少有为 / 李荣浩
不将就 / 李荣浩
模特 / 李荣浩
消愁 / 毛不易
像我这样的人 / 毛不易
平凡的一天 / 毛不易
这世界那么多人 / 莫文蔚
慢慢喜欢你 / 莫文蔚
乌梅子酱 / 李荣浩`),
  list("challenge", "准备好了，再挑战高音", "用舒适的音域练习，也可以低八度跟唱", "进阶挑战", "#d797a8", `泡沫 / 邓紫棋
光年之外 / 邓紫棋
喜欢你 / 邓紫棋
煎熬 / 李佳薇
野子 / 苏运莹
大鱼 / 周深
你要的全拿走 / 胡彦斌
如果你也听说 / 张惠妹
记得 / 张惠妹
领悟 / 辛晓琪`),
  list("duet", "两个人的合唱时间", "一个人练自己的声部，也能慢慢合上", "合唱情歌", "#8eaad8", `小酒窝 / 林俊杰、蔡卓妍
有点甜 / 汪苏泷、By2
今天你要嫁给我 / 陶喆、蔡依林
屋顶 / 温岚、周杰伦
珊瑚海 / 周杰伦、梁心颐
广岛之恋 / 莫文蔚、张洪量
被风吹过的夏天 / 金莎、林俊杰
只对你有感觉 / 飞轮海、田馥甄
不得不爱 / 潘玮柏、弦子
你最珍贵 / 张学友、高慧君`),
];
export const SONG_COUNT = new Set(PLAYLISTS.flatMap(p=>p.songs.map(s=>s.id))).size;
export const PLATFORMS = ["Apple Music", "网易云音乐", "QQ 音乐", "Spotify"] as const;
export type Platform = typeof PLATFORMS[number];
export function songLink(song: SuggestedSong, platform: Platform): string {
  const q=encodeURIComponent(`${song.title} ${song.artist}`);
  switch(platform){
    case "网易云音乐":return `https://music.163.com/#/search/m/?s=${q}&type=1`;
    case "QQ 音乐":return `https://y.qq.com/n/ryqq_v2/search?w=${q}&t=song`;
    case "Spotify":return `https://open.spotify.com/search/${q}`;
    default:return `https://music.apple.com/cn/search?term=${q}`;
  }
}
