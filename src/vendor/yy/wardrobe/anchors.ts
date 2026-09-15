// YY wardrobe must use these local character anchors as the source of truth.
// Do not introduce human-body anchors such as arm/chest/shoulder/cape for the
// current YY shape; external outfit art must be adapted into these overlay slots.
// For the current YY body, front clothing/scarf/belt-style items share the
// canonical `body` front decoration point. Do not keep extra front-body aliases
// in V1 metadata.
export type YyWardrobeAnchorId =
  | "hat"
  | "ear_left"
  | "ear_right"
  | "glasses"
  | "face_accessory"
  | "body"
  | "hand_left"
  | "hand_right";

export type YyWardrobeAnchor = {
  id: YyWardrobeAnchorId;
  label: string;
  description: string;
  x: number;
  y: number;
  rotate: number;
  defaultLayer: number;
  conflictGroup: string;
};

export const YY_WARDROBE_ANCHORS: Record<YyWardrobeAnchorId, YyWardrobeAnchor> = {
  hat: {
    id: "hat",
    label: "帽子 / 头顶装饰",
    description: "YY 头顶和两耳之间的上方区域，适用于帽子、头盔上半部分、发饰、头顶装饰。",
    x: 150,
    y: 76,
    rotate: 0,
    defaultLayer: 30,
    conflictGroup: "hat",
  },
  ear_left: {
    id: "ear_left",
    label: "左耳装饰",
    description: "YY 左耳，适用于左耳套、左耳饰、左侧头盔耳部结构。",
    x: 70,
    y: 70,
    rotate: 0,
    defaultLayer: 31,
    conflictGroup: "ear_left",
  },
  ear_right: {
    id: "ear_right",
    label: "右耳装饰",
    description: "YY 右耳，适用于右耳套、右耳饰、右侧头盔耳部结构。",
    x: 230,
    y: 70,
    rotate: 0,
    defaultLayer: 31,
    conflictGroup: "ear_right",
  },
  glasses: {
    id: "glasses",
    label: "眼镜 / 面部覆盖层",
    description: "YY 两只眼睛前方，适用于眼镜、护目镜、半透明面罩、面具中覆盖眼睛的部分。",
    x: 150,
    y: 130,
    rotate: 0,
    defaultLayer: 40,
    conflictGroup: "glasses",
  },
  face_accessory: {
    id: "face_accessory",
    label: "脸部小装饰",
    description: "鼻子周围、脸颊区域，适用于贴纸、腮红、小胡子、小面罩下缘。不能改变 YY 鼻子和眼睛基础形象。",
    x: 150,
    y: 164,
    rotate: 0,
    defaultLayer: 42,
    conflictGroup: "face_sticker",
  },
  body: {
    id: "body",
    label: "身体前身装饰",
    description: "YY 当前唯一前身装饰点。围巾、领结、衣服、项链、腰带、前身挂件、胸前图案都统一挂这里，不能改变 YY 身体外轮廓。",
    x: 150,
    y: 194,
    rotate: 0,
    defaultLayer: 45,
    conflictGroup: "front_accessory",
  },
  hand_left: {
    id: "hand_left",
    label: "左小手装饰",
    description: "YY 左侧小手，适用于左手套、左手小道具。YY 没有手臂，不要拆成 arm。",
    x: 50,
    y: 200,
    rotate: 0,
    defaultLayer: 60,
    conflictGroup: "hand_left",
  },
  hand_right: {
    id: "hand_right",
    label: "右小手装饰",
    description: "YY 右侧小手，适用于右手套、右手小道具。YY 没有手臂，不要拆成 arm。",
    x: 250,
    y: 200,
    rotate: 0,
    defaultLayer: 60,
    conflictGroup: "hand_right",
  },
};

export const YY_WARDROBE_ANCHOR_ORDER: YyWardrobeAnchorId[] = [
  "hat",
  "ear_left",
  "ear_right",
  "glasses",
  "face_accessory",
  "body",
  "hand_left",
  "hand_right",
];

export function getYyWardrobeAnchor(anchorId: YyWardrobeAnchorId): YyWardrobeAnchor {
  return YY_WARDROBE_ANCHORS[anchorId];
}
