import type { AlbumFrame, AlbumName } from "./frames";

type SunflowerPlacement =
  "hillside" | "question" | "sunward" | "starlight" | "seasons" | "dedication";
type SunflowerVerse = {
  placement: SunflowerPlacement;
  phrases: string[];
  turn?: { after: number; frame: AlbumFrame<"夜晚的向日葵">; pause: number };
};

function sunflower(
  frame: AlbumFrame<"夜晚的向日葵">,
  placement: SunflowerPlacement,
  phrases: string[],
  turn?: SunflowerVerse["turn"]
) {
  return { frame, text: phrases.join(""), verse: { placement, phrases, turn } };
}

type Scene = {
  [A in AlbumName]: {
    location: A;
    label?: string;
    title: [string, string];
    cover: AlbumFrame<A>;
    lines: {
      text: string;
      frame: AlbumFrame<A>;
      speaker?: string;
      verse?: A extends "夜晚的向日葵" ? SunflowerVerse : never;
    }[];
  };
}[AlbumName];

// The voices are kept separate where the supplied text identifies a speaker.
const sceneDefinitions: Scene[] = [
  {
    title: ["夜晚的向日葵，", "存在的理由\n又是什么呢？"],
    location: "夜晚的向日葵",
    cover: "flower-bed",
    lines: [
      // Opening exchange excerpted from the Chinese quotation of 向日葵の坂道.
      // https://taf.fyi/acgn/subarashiki-hibi/#向日葵
      sunflower("flower-bed", "hillside", [
        "「不是说向日葵会一直朝太阳的方向盛开吗？」",
      ]),
      sunflower("flower-bed", "hillside", [
        "「一旦开花了，",
        "就再也不会追着太阳了。」",
      ]),
      sunflower("sunflower-roof", "question", [
        "——夜晚的向日葵，",
        "存在的理由又是什么呢？",
      ]),
      sunflower("at-sunset", "sunward", [
        "——命中注定要朝向阳光生长，",
        "那夜晚的向日葵们，",
        "岂不是很辛苦？",
      ]),
      sunflower(
        "last-warmth",
        "starlight",
        [
          "——哈哈，总能忍过去。",
          "没有太阳，",
          "有一点点星光，一点点希望，",
          "活着，就足够了吧。",
        ],
        { after: 3, frame: "embrace", pause: 3000 }
      ),
      sunflower("flower-bed", "seasons", [
        "——如初春雪，暮春樱，",
        "夏晚荷，秋寒叶，",
        "天降物哀，执拗、纯粹而绝美。",
      ]),
      sunflower("night-piano", "dedication", [
        "——这曲，",
        "是为一切不合时宜者而作。",
      ]),
    ],
  },
  {
    title: ["银河铁道之夜", "我们一起走吧。"],
    location: "银河铁道之夜",
    cover: "two-windows",
    lines: [
      // Translated here from chapter IX of Miyazawa's novel, not game dialogue.
      // https://www.aozora.gr.jp/cards/000081/files/456_15050.html
      {
        frame: "two-windows",
        speaker: "乔万尼",
        text: "「康帕内拉，又只剩我们两个了。\n不管走到多远，我们都一起去吧。」",
      },
      {
        frame: "train-stars",
        speaker: "乔万尼",
        text: "「可是，真正的幸福究竟是什么呢？」",
      },
      {
        frame: "train-stars",
        speaker: "康帕内拉",
        text: "「我不知道。」",
      },
      // The author's selection for the coda, outside the quoted conversation.
      {
        frame: "train-stars",
        text: "即使你在我一米之外，\n我见到的也是三纳秒以前的你。",
      },
      {
        frame: "white-wings",
        text: "我们所眼见的都是过去，\n而一切，也都会过去。",
      },
    ],
  },
  {
    title: ["我是摘去帽尖白羽的", "西哈诺。"],
    location: "西哈诺",
    cover: "dusk-roof",
    lines: [
      {
        frame: "dusk-roof",
        text: "矗立在天台，薄烟渺渺，裙摆轻扬。\n沉重地吸入，轻盈地呼出。",
      },
      { frame: "dusk-roof", text: "我是谁？" },
      {
        frame: "blue-sky",
        text: "漫天流云飘散，消散的可是皎洁月光。\n我是摘去帽尖白羽的西哈诺。",
      },
      {
        frame: "blue-sky",
        text: "焦灼日光透过泪眸，泛出肥皂泡般的斑斓。",
      },
      {
        frame: "blue-sky",
        text: "诗人、剑客、空气动力学家？\n而我，太过沉重。",
      },
      // The letter passes from Cyrano to Christian in Act II, scene X.
      { frame: "edge-of-sight", text: "把信拿去吧——你可以使假戏成真。" },
      {
        frame: "edge-of-sight",
        text: "拿去吧！由于不是出自真心，\n话就说得格外动听！",
      },
      // Keep the final words of Act V on the same still as the preceding breath.
      {
        frame: "cyrano-piano",
        text: "我有一样毫无皱纹毫无斑点的东西，\n你们只好任凭我带走，",
      },
      { frame: "cyrano-piano", text: "这就是我冠上的羽毛。" },
    ],
  },
  {
    title: ["所以我才能", "继续战斗"],
    location: "文学少女与化学少女（文学不会输）",
    label: "文学不会输",
    cover: "reading-room",
    lines: [
      {
        frame: "reading-room",
        speaker: "希实香",
        text: "凭文学是无法打败敌人的……\n能打倒敌人的学问只有化学跟物理！",
      },
      {
        frame: "reading-room",
        speaker: "柘榴",
        text: "呜，呜，但文学是不会输的",
      },
      { frame: "reading-room", speaker: "希实香", text: "不会输？" },
      {
        frame: "on-the-roof",
        speaker: "柘榴",
        text: "文学不是为了胜利的学问……",
      },
      {
        frame: "school-sky",
        speaker: "柘榴",
        text: "而是为了立于不败之地的学问……",
      },
      { frame: "on-paper", speaker: "柘榴", text: "所以我才能继续战斗" },
    ],
  },
  {
    title: ["我想拥抱她。", "只想拥抱她。"],
    location: "我只想拥抱她",
    cover: "firelight",
    lines: [
      { frame: "paper-birds", text: "世界又如何。补偿又如何。" },
      { frame: "sunflowers", text: "高岛又如何。" },
      { frame: "paper-birds", text: "诅咒又如何。死亡又如何。" },
      {
        frame: "firelight",
        text: "我想拥抱她。只想拥抱她。\n除此之外，都无所谓。",
      },
      { frame: "paper-birds", text: "都死了又如何。世界亦然。" },
      { frame: "classroom-floor", text: "我亦然。希实香亦然。" },
      {
        frame: "firelight",
        text: "什么都不剩又如何。一切都消失了又如何。",
      },
      { frame: "star-score", text: "我只是……我只是想……拥抱她。" },
      {
        frame: "firelight",
        text: "临死前，即便那只是刹那的世界，我仍感受到了她生的温暖。",
      },
    ],
  },
];

export const scenes = sceneDefinitions.map(scene => ({
  ...scene,
  label: scene.label ?? scene.location,
}));
