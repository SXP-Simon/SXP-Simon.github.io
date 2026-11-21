import type { FrameKey } from "./frames";

type Passage = { text: string; frame: FrameKey; speaker?: string };
type Scene = {
  title: [string, string];
  location: string;
  cover: FrameKey;
  lines: Passage[];
};

// The voices are kept separate where the supplied text identifies a speaker.
export const scenes: Scene[] = [
  {
    title: ["夜晚的向日葵，", "存在的理由\n又是什么呢？"],
    location: "夜晚的向日葵",
    cover: "sunflowers",
    lines: [
      { frame: "sunflowers", text: "——夜晚的向日葵，存在的理由又是什么呢？" },
      {
        frame: "sunflowers",
        text: "——命中注定要朝向阳光生长，那夜晚的向日葵们，岂不是很辛苦？",
      },
      {
        frame: "night-piano",
        text: "——哈哈，总能忍过去。没有太阳，有一点点星光，一点点希望，活着，就足够了吧。",
      },
      {
        frame: "paper-birds",
        text: "——如初春雪，暮春樱，夏晚荷，秋寒叶，天降物哀，执拗、纯粹而绝美。",
      },
      { frame: "night-piano", text: "——这曲，是为一切不合时宜者而作。" },
    ],
  },
  {
    title: ["我们所眼见的都是过去，", "而一切，\n也都会过去。"],
    location: "世界的界限",
    cover: "blue-sky",
    lines: [
      { frame: "blue-sky", text: "天之苍苍，其正色邪？其远而无所至极邪？" },
      {
        frame: "blue-sky",
        text: "你知道吗，我们见到的太阳，是八分钟前的太阳，见到的月亮，是一点三秒之前的月亮，见到一英里之外的建筑，是五微秒之前存在的，即使你在我一米之外，我见到的也是三纳秒以前的你。",
      },
      {
        frame: "two-windows",
        text: "我们所眼见的都是过去，而一切，也都会过去。",
      },
      {
        frame: "edge-of-sight",
        speaker: "维特根斯坦《逻辑哲学论》",
        text: "主体不属于世界，然而它是世界的一个界限。",
      },
      {
        frame: "edge-of-sight",
        speaker: "维特根斯坦《逻辑哲学论》",
        text: "在世界上哪里可以找到一个形而上主体呢？",
      },
      {
        frame: "two-windows",
        speaker: "维特根斯坦《逻辑哲学论》",
        text: "你会说这就正好像眼睛和视域的情形一样。但是事实上你看不见眼睛。",
      },
      {
        frame: "blue-sky",
        speaker: "维特根斯坦《逻辑哲学论》",
        text: "而且在视野里没有任何东西使得你能推论出那是被一只眼睛看到的。",
      },
    ],
  },
  {
    title: ["我是摘去帽尖白羽的", "西哈诺。"],
    location: "冠上的羽毛",
    cover: "on-the-roof",
    lines: [
      {
        frame: "on-the-roof",
        text: "矗立在天台，薄烟渺渺，裙摆轻扬。沉重地吸入，轻盈地呼出。",
      },
      { frame: "empty-seat", text: "我是谁" },
      {
        frame: "white-wings",
        text: "漫天流云飘散，消散的可是皎洁月光。我是摘去帽尖白羽的西哈诺。",
      },
      {
        frame: "on-the-roof",
        text: "焦灼日光透过泪眸，泛出肥皂泡般的斑斓。诗人、剑客、空气动力学家？而我，太过沉重。",
      },
      {
        frame: "empty-seat",
        text: "我们的情人不过是随便借个名字用\n幻想吹出来的肥泡……",
      },
      { frame: "two-windows", text: "把信拿去吧——你可以使假戏成真。" },
      {
        frame: "two-windows",
        text: "我本来是无病呻吟，漫无目的地吐露爱情……. 现在这些漂泊不定的鸟几有地方栖息了，你可以从信里看出来——",
      },
      {
        frame: "empty-seat",
        text: "拿去吧！由于不是出自真心，话\n就说得格外动听！",
      },
      {
        frame: "white-wings",
        text: "桂枝和玫瑰都被你们拔光了！拔吧！但有一样东西，你们只能任凭我今晚带进天堂，我一行礼就把蔚蓝的门槛打扫干净，我有一样毫无皱纹毫无斑点的东西，你们只好任凭我带走，这就是我冠上的羽毛。",
      },
    ],
  },
  {
    title: ["所以我才能", "继续战斗"],
    location: "文学不会输",
    cover: "reading-room",
    lines: [
      {
        frame: "reading-room",
        speaker: "希实香",
        text: "凭文学是无法打败敌人的……能打倒敌人的学问只有化学跟物理！",
      },
      {
        frame: "reading-room",
        speaker: "柘榴",
        text: "呜，呜，但文学是不会输的",
      },
      { frame: "on-paper", speaker: "希实香", text: "不会输？" },
      {
        frame: "on-paper",
        speaker: "柘榴",
        text: "文学不是为了胜利的学问……而是为了立于不败之地的学问……",
      },
      { frame: "reading-room", speaker: "柘榴", text: "所以我才能继续战斗" },
    ],
  },
  {
    title: ["我想拥抱她。", "只想拥抱她。"],
    location: "我想拥抱她",
    cover: "at-sunset",
    lines: [
      {
        frame: "at-sunset",
        text: "世界又如何。补偿又如何。高岛又如何。\n诅咒又如何。死亡又如何。",
      },
      {
        frame: "at-sunset",
        text: "我想拥抱她。只想拥抱她。\n除此之外，都无所谓。",
      },
      {
        frame: "last-warmth",
        text: "都死了又如何。世界亦然。我亦然。希实香亦然。\n什么都不剩又如何。一切都消失了又如何。",
      },
      { frame: "embrace", text: "我只是……我只是想……拥抱她。" },
      {
        frame: "last-warmth",
        text: "临死前，即便那只是刹那的世界，我仍感受到了她生的温暖。",
      },
      {
        frame: "embrace",
        text: "对于人生的意义，没有追问的必要，也没有必要为人生不可解明而困惑。",
      },
      {
        frame: "at-sunset",
        text: "这个世界，这个宇宙，这片天空，这条河，这条路……没有必要为这一切的无法解明而困惑。",
      },
      {
        frame: "embrace",
        text: "因为人活着这件事，就拥有着连其本身都能包含的深邃。那和上帝一样大，和上帝一样重。那就是美妙的旋律和美妙的话语。",
      },
    ],
  },
];
