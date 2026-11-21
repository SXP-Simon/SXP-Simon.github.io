import { getAssetPath } from "@/utils/withBase";

function frame(
  source: string,
  ratio: number,
  x: number,
  y: number,
  tone: string,
  portrait: boolean,
  alt: string
) {
  return { source, ratio, x, y, tone, portrait, alt };
}

// Folder names and file stems mirror the author's CG collection.
export const albums = {
  夜晚的向日葵: {
    "flower-bed": frame(
      "2121A47E1C3CB7E0B187084D5B92CED3",
      1260 / 932,
      65,
      46,
      "#5e4955",
      false,
      "少女侧卧在金色的花丛间，花瓣和长发铺满了画面。"
    ),
    "at-sunset": frame(
      "575504BDC6DB6C4464BB2DB6090FAA59",
      1480 / 1110,
      50,
      44,
      "#40384d",
      false,
      "夕照下两个人面对面站着，双手交叠在光里。"
    ),
    embrace: frame(
      "71A0092AE4FFD5B762DA7ABB8E2C1BC9",
      1480 / 1110,
      63,
      38,
      "#393649",
      false,
      "暮光里，一双手从身后环住闭着眼睛的人。"
    ),
    "last-warmth": frame(
      "C06ADF1E5CB8D9201019838599C91C53",
      1280 / 960,
      50,
      42,
      "#382c37",
      false,
      "昏暗的近景里，一只手轻轻碰到少女的手。"
    ),
    "night-piano": frame(
      "61179B707272B037F095A3417DA5470F",
      1004 / 1420,
      54,
      54,
      "#20233f",
      true,
      "星河与水面之间，少女坐在打开的钢琴旁。"
    ),
    "sunflower-roof": frame(
      "BDDC1BF488F3E6C26E5C27CCD246AA46",
      1004 / 1420,
      56,
      14,
      "#324547",
      true,
      "屋顶的栏杆旁，长发少女闭着眼睛仰起脸。"
    ),
  },
  银河铁道之夜: {
    "two-windows": frame(
      "178D0A54BF0663EE60A84B57FA44CE3B",
      1050 / 1420,
      52,
      50,
      "#373443",
      true,
      "上下两扇车窗，两侧的人各自望向窗外。"
    ),
    "white-wings": frame(
      "1FAED1966B4D09E48C7FEAE791E804BD",
      896 / 1420,
      54,
      61,
      "#151b3e",
      true,
      "蓝色星轨穿过黑夜，白鸟从窗边掠过。"
    ),
    "train-stars": frame(
      "8EC63A22EA2C664382062EB488FDB028",
      714 / 1200,
      50,
      50,
      "#242237",
      true,
      "两张侧脸分别映在暗处，最下方的窗里连着一座星座。"
    ),
  },
  西哈诺: {
    "dusk-roof": frame(
      "yuukii",
      1480 / 841,
      29,
      34,
      "#624153",
      false,
      "暮色中的天台上，少女的身影倚着铁丝网，长发迎风扬起。"
    ),
    "blue-sky": frame(
      "E7856B385929A1F90DA8FCD73F01F983",
      1300 / 900,
      60,
      37,
      "#2f4257",
      false,
      "女孩仰着脸，发丝被吹向蓝天与白云。"
    ),
    "edge-of-sight": frame(
      "EDBC5B4920097062F56DD420E31699AD",
      1260 / 1252,
      44,
      27,
      "#596b77",
      false,
      "淡青色的人影从一片留白中浮现。"
    ),
    "cyrano-piano": frame(
      "61179B707272B037F095A3417DA5470F",
      1004 / 1420,
      54,
      54,
      "#20233f",
      true,
      "星河与水面之间，少女坐在打开的钢琴旁。"
    ),
  },
  "文学少女与化学少女（文学不会输）": {
    "reading-room": frame(
      "0787173D7D8ABCFD406931F4A071052B",
      1480 / 1046,
      49,
      49,
      "#30352f",
      false,
      "两个人坐在堆满书的房间里，书页间透着一束光。"
    ),
    "on-paper": frame(
      "1DCB0D8FAE759DA0ECDDF91E5D6590B5",
      1020 / 1420,
      54,
      42,
      "#53474a",
      true,
      "浅色纸面上的两个人影，笔触沿着脚下的影子散开。"
    ),
    "on-the-roof": frame(
      "BDDC1BF488F3E6C26E5C27CCD246AA46",
      1004 / 1420,
      56,
      14,
      "#324547",
      true,
      "屋顶的栏杆旁，长发少女闭着眼睛仰起脸。"
    ),
    "school-sky": frame(
      "小橘子高岛",
      1480 / 1115,
      48,
      32,
      "#395978",
      false,
      "两名穿校服的少女并肩俯身，身后是明亮的蓝天。"
    ),
  },
  我只想拥抱她: {
    firelight: frame(
      "885F2DCD021434EFED98C89DC39E5455",
      1480 / 740,
      48,
      32,
      "#50312e",
      false,
      "橙红色的光中，两人的额头轻轻抵在一起。"
    ),
    sunflowers: frame(
      "0CC9B1F2AEE8B84525B8861A3E328DE2",
      959 / 1420,
      54,
      89,
      "#443036",
      true,
      "倒悬在金色夕照中的少女，长发落入远处的街景。"
    ),
    "classroom-floor": frame(
      "31907F2A7D1CA4CBC39FCC8F0C448C30",
      1480 / 914,
      55,
      39,
      "#61483f",
      false,
      "暖色斜光落在教室地板上，两名少女伸出手，指尖相接。"
    ),
    "paper-birds": frame(
      "F24D2C0F33D692E7FBD6155E555311C6",
      906 / 1420,
      50,
      45,
      "#503446",
      true,
      "粉白的羽翼围拢在少女身旁。"
    ),
    "star-score": frame(
      "2DC2520BB338D56813047E2C19B06189",
      1200 / 675,
      55,
      42,
      "#25233c",
      false,
      "星空中，两个人隔着弯曲的五线谱相望。"
    ),
  },
} as const;

export type AlbumName = keyof typeof albums;
export type AlbumFrame<A extends AlbumName> = Extract<
  keyof (typeof albums)[A],
  string
>;
export type FrameKey = { [A in AlbumName]: AlbumFrame<A> }[AlbumName];

type Artwork = ReturnType<typeof frame> & {
  full: string;
  mobile: string;
  thumb: string;
};
export const frames = Object.fromEntries(
  Object.entries(albums).flatMap(([folder, images]) =>
    Object.entries(images).map(([key, image]) => {
      const path = getAssetPath(`scene-art/${folder}/${image.source}`);
      return [
        key,
        {
          ...image,
          full: path + "-full.webp",
          mobile: path + "-mobile.webp",
          thumb: path + "-thumb.webp",
        },
      ];
    })
  )
) as Record<FrameKey, Artwork>;
