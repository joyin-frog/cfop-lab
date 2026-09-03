export const learningPaths = {
  cross: {
    step: "01 / 04",
    title: "先把白十字变成可规划的步骤",
    description: "白色朝下，先不限时规划四条棱，再逐渐压到 8 步和 15 秒观察。",
    milestones: [
      { title: "找四条白棱", description: "只观察，不转动" },
      { title: "白色朝下", description: "建立空间感" },
      { title: "8 步以内", description: "减少重复破坏" },
      { title: "连续完成", description: "落手后不暂停" },
    ],
  },
  f2l: {
    step: "02 / 04",
    title: "先理解配对，再补齐不顺手案例",
    description: "F2L 不从 41 条公式硬背。先学基础入槽和顶层配对，最后处理错对与槽内案例。",
    milestones: [
      { title: "基础入槽", description: "先掌握左右手基础插入", caseIds: range(1, 4) },
      { title: "顶层配对", description: "理解角棱如何组成一对", caseIds: range(5, 18) },
      { title: "拆开错对", description: "先拆再配，避免硬记", caseIds: range(19, 24) },
      { title: "槽内案例", description: "补齐角棱被困住的情况", caseIds: range(25, 41) },
    ],
  },
  oll: {
    step: "03 / 04",
    title: "黄十字以后，从小鱼开始扩展",
    description: "先沿用层先法完成黄十字，学完 7 种顶角形状；然后先去 PLL 完成二步最后一层，再回来按轮廓补完整 OLL。",
    prerequisite: "前置：已经会做黄十字",
    milestones: [
      { title: "小鱼起步", description: "最顺手的两个顶角案例", caseIds: ["27", "26"] },
      { title: "补齐二步 OLL", description: "加上其余 5 种顶角形状", caseIds: ["21", "22", "24", "25", "23"] },
      { title: "简单轮廓", description: "T、方块、C 与 W", caseIds: ["33", "45", "05", "06", "34", "46", "36", "38"] },
      { title: "P、I 与角块", description: "侧面黄块更有规律", caseIds: ["28", "57", "31", "32", "43", "44", "51", "56", "52", "55"] },
      { title: "鱼与骑士", description: "学习成对镜像案例", caseIds: ["09", "10", "35", "37", "13", "14", "16", "15", "29", "30", "41", "42"] },
      { title: "L 与闪电", description: "用触发器拆分长公式", caseIds: ["48", "47", "49", "50", "53", "54", "07", "08", "11", "12", "39", "40"] },
      { title: "点形收尾", description: "最后学习识别最难的一组", caseIds: ["01", "02", "03", "04", "18", "19", "17", "20"] },
    ],
  },
  pll: {
    step: "04 / 04",
    title: "先学二步 PLL，再补完整 21 个",
    description: "先用 2 个角块公式和 4 个棱块公式稳定还原；接着优先补完整 PLL，再回头慢慢补齐完整 OLL。",
    milestones: [
      { title: "二步 PLL · 6 个", description: "角换 Aa/E，棱换 Ua/Ub/H/Z", caseIds: ["Aa", "E", "Ua", "Ub", "H", "Z"] },
      { title: "高频核心", description: "先学 T、J、Y 与反向 A", caseIds: ["T", "Jb", "Ja", "Y", "Ab"] },
      { title: "R、F 与 V", description: "按头灯和色条区分", caseIds: ["Ra", "Rb", "F", "V"] },
      { title: "四种 G", description: "整组训练，避免互相混淆", caseIds: ["Ga", "Gb", "Gc", "Gd"] },
      { title: "N Perm 收尾", description: "概率低、公式长，最后再学", caseIds: ["Na", "Nb"] },
    ],
  },
};

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => String(start + index).padStart(2, "0"));
}

export function learningOrderFor(stage) {
  return learningPaths[stage]?.milestones.flatMap((milestone) => milestone.caseIds || []) || [];
}

export function compareLearningOrder(stage, first, second) {
  const order = learningOrderFor(stage);
  const firstIndex = order.indexOf(first.id);
  const secondIndex = order.indexOf(second.id);
  return (firstIndex < 0 ? Number.POSITIVE_INFINITY : firstIndex)
    - (secondIndex < 0 ? Number.POSITIVE_INFINITY : secondIndex);
}
