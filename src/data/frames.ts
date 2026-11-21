import { getAssetPath } from "@/utils/withBase";

const base = getAssetPath("scene-art/");

function frame(
  name: string,
  x: number,
  y: number,
  tone: string,
  portrait: boolean,
  alt: string
) {
  return {
    full: base + name + "-full.webp",
    mobile: base + name + "-mobile.webp",
    thumb: base + name + "-thumb.webp",
    x,
    y,
    tone,
    portrait,
    alt,
  };
}
export const frames = {
  "reading-room": frame(
    "reading-room",
    49,
    49,
    "#30352f",
    false,
    "两个人坐在堆满书的房间里，书页间透着一束光。"
  ),
  sunflowers: frame(
    "sunflowers",
    54,
    89,
    "#443036",
    true,
    "倒悬在金色夕照中的少女，长发落入远处的街景。"
  ),
  "two-windows": frame(
    "two-windows",
    52,
    50,
    "#373443",
    true,
    "上下两扇车窗，两侧的人各自望向窗外。"
  ),
  "on-paper": frame(
    "on-paper",
    54,
    42,
    "#53474a",
    true,
    "浅色纸面上的两个人影，笔触沿着脚下的影子散开。"
  ),
  "white-wings": frame(
    "white-wings",
    54,
    61,
    "#151b3e",
    true,
    "蓝色星轨穿过黑夜，白鸟从窗边掠过。"
  ),
  "at-sunset": frame(
    "at-sunset",
    50,
    44,
    "#40384d",
    false,
    "夕照下两个人面对面站着，双手交叠在光里。"
  ),
  "night-piano": frame(
    "night-piano",
    54,
    54,
    "#20233f",
    true,
    "星河与水面之间，少女坐在打开的钢琴旁。"
  ),
  embrace: frame(
    "embrace",
    63,
    38,
    "#393649",
    false,
    "暮光里，一双手从身后环住闭着眼睛的人。"
  ),
  "on-the-roof": frame(
    "on-the-roof",
    56,
    14,
    "#324547",
    true,
    "屋顶的栏杆旁，长发少女闭着眼睛仰起脸。"
  ),
  "last-warmth": frame(
    "last-warmth",
    50,
    42,
    "#382c37",
    false,
    "昏暗的近景里，一只手轻轻碰到少女的手。"
  ),
  "empty-seat": frame(
    "empty-seat",
    52,
    49,
    "#30272a",
    true,
    "斜照的车窗前，长发的身影坐在空座旁。"
  ),
  "blue-sky": frame(
    "blue-sky",
    60,
    37,
    "#2f4257",
    false,
    "女孩仰着脸，发丝被吹向蓝天与白云。"
  ),
  "edge-of-sight": frame(
    "edge-of-sight",
    44,
    27,
    "#596b77",
    false,
    "淡青色的人影从一片留白中浮现。"
  ),
  "paper-birds": frame(
    "paper-birds",
    50,
    45,
    "#503446",
    true,
    "粉白的羽翼围拢在少女身旁。"
  ),
} as const;
export type FrameKey = keyof typeof frames;
