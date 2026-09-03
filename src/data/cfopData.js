import f2lSource from "./f2l.json" with { type: "json" };
import ollSource from "./oll.json" with { type: "json" };
import pllSource from "./pll.json" with { type: "json" };

const OLL_GROUPS = {
  "No Edges Oriented": "点形",
  Squares: "方块",
  "Lightning Bolts": "闪电",
  "Fish-Shapes": "小鱼",
  "Knight Move Shapes": "骑士形",
  "Awkward Shapes": "别扭形",
  "P-Shapes": "P 形",
  "I-Shapes": "I 形",
  "C-Shapes": "C 形",
  "T-Shapes": "T 形",
  "W-Shapes": "W 形",
  "Corners Oriented": "角块已定向",
  "All Edges Oriented": "十字形",
  "Corners Correct": "角块位置正确",
  "L-Shapes": "L 形",
};

const F2L_GROUPS = {
  "Basic Insert": "基础插入",
  "Different Facing Up": "异色朝上",
  "Same Facing Up": "同色朝上",
  "White Facing Up": "白色朝上",
  "Incorrectly Connected": "错误配对",
  "Corner In Edge Out": "角在槽内",
  "Edge In Corner Out": "棱在槽内",
  "Both In Slot": "都在槽内",
};

const OLL_NAMES = {
  21: "H 型",
  22: "π 型",
  23: "头灯",
  24: "T 型",
  25: "梅花七",
  26: "逆小鱼",
  27: "小鱼",
};

// OLL has 216 equally likely orientation states (including OLL skip).
// Rotational symmetry determines whether a named case covers 4, 2, or 1 states.
const OLL_HALF_TURN_SYMMETRY = new Set([1, 21, 55, 56, 57]);
const OLL_QUARTER_TURN_SYMMETRY = new Set([20]);

// PLL has 72 equally likely permutation states (including PLL skip).
const PLL_HALF_TURN_SYMMETRY = new Set(["E", "Z"]);
const PLL_QUARTER_TURN_SYMMETRY = new Set(["H", "Na", "Nb"]);

function ollProbabilityDenominator(id) {
  const caseId = Number(id);
  if (OLL_QUARTER_TURN_SYMMETRY.has(caseId)) return 216;
  if (OLL_HALF_TURN_SYMMETRY.has(caseId)) return 108;
  return 54;
}

function pllProbabilityDenominator(id) {
  if (PLL_QUARTER_TURN_SYMMETRY.has(id)) return 72;
  if (PLL_HALF_TURN_SYMMETRY.has(id)) return 36;
  return 18;
}

function cleanAlg(value) {
  return value.replace(/[()]/g, "").replace(/2'/g, "2").replace(/\s+/g, " ").trim();
}

export const f2lCases = f2lSource.map((item) => ({
  id: String(item.id).padStart(2, "0"),
  stage: "f2l",
  name: `F2L ${String(item.id).padStart(2, "0")}`,
  alias: F2L_GROUPS[item.group] || item.group,
  group: F2L_GROUPS[item.group] || item.group,
  algorithm: cleanAlg(item.algorithms[0]),
  alternatives: item.algorithms.slice(1).map(cleanAlg),
  recognition: "先找到同一组角块与棱块，观察白色朝向和两块是否已经配对，再决定是配对、拆对还是直接入槽。",
  hold: "默认练习右前槽（FR）。把目标槽放在右前，先用 U 层对齐案例再执行。",
}));

export const ollCases = ollSource.map((item) => ({
  id: String(item.id).padStart(2, "0"),
  stage: "oll",
  name: OLL_NAMES[item.id] || item.name,
  alias: OLL_NAMES[item.id] ? item.name : `OLL ${String(item.id).padStart(2, "0")}`,
  group: OLL_GROUPS[item.group] || item.group,
  probabilityDenominator: ollProbabilityDenominator(item.id),
  algorithm: cleanAlg(item.algorithm),
  alternatives: [],
  recognition: "先看顶层黄贴形成的轮廓，再用侧面的黄色贴纸确认方向。只看顶面相似，拿法仍可能相反。",
  hold: "黄色面朝上。旋转 U 层，让图下方对应你面对的前面，再执行公式。",
}));

function pllGroup(id) {
  if (["H", "Ua", "Ub", "Z"].includes(id)) return "仅棱块交换";
  if (["Aa", "Ab", "E"].includes(id)) return "仅角块交换";
  if (["Na", "Nb", "V", "Y"].includes(id)) return "对角交换";
  return "相邻交换";
}

export const pllCases = pllSource.map((item) => ({
  id: item.id,
  stage: "pll",
  name: item.name,
  alias: `PLL ${item.id}`,
  group: pllGroup(item.id),
  probabilityDenominator: pllProbabilityDenominator(item.id),
  algorithm: cleanAlg(item.algorithm),
  alternatives: [],
  recognition: "黄色面已经完成。寻找侧面同色的头灯、完整色条或需要循环的三块，再确定拿法。",
  hold: "黄色面朝上。优先把已完成的一面或头灯放到公式要求的位置。",
}));

export const stageMeta = {
  cross: {
    label: "Cross",
    title: "底层十字",
    subtitle: "先观察，后落手",
    description: "目标不是背固定公式，而是在 15 秒观察内规划四条白棱，尽量连续完成并把十字留在底层。",
    count: "直觉",
  },
  f2l: {
    label: "F2L",
    title: "前两层",
    subtitle: "41 个标准情形",
    description: "把一角一棱组成一对再插入。先建立直觉，再用 41 个案例补齐不顺手和槽内案例。",
    count: 41,
  },
  oll: {
    label: "OLL",
    title: "顶层定向",
    subtitle: "57 个完整 OLL",
    description: "一次把顶层翻成全黄。按轮廓分组学习：点、线、十字、小鱼和各种块形。",
    count: 57,
  },
  pll: {
    label: "PLL",
    title: "顶层排列",
    subtitle: "21 个完整 PLL",
    description: "黄色面完成后排列顶层侧块。先认头灯与色条，再区分角换、棱换和混合交换。",
    count: 21,
  },
};

export const casesByStage = { f2l: f2lCases, oll: ollCases, pll: pllCases };

export const crossLessons = [
  { id: "01", title: "找四条白棱", tag: "识别", text: "先只找白色棱块，再看它另一面的中心色。不要边找边转。" },
  { id: "02", title: "先放相对两条", tag: "规划", text: "优先处理互不干扰的棱块，减少做完一条又拆掉一条。" },
  { id: "03", title: "十字始终朝下", tag: "手法", text: "从第一步就让白色朝下，练习空间关系，减少最后翻面。" },
  { id: "04", title: "目标 8 步以内", tag: "训练", text: "不限时观察并数步；稳定后再把完整规划塞进 15 秒观察。" },
];

export const statusMeta = {
  new: { label: "未开始", next: "learning" },
  learning: { label: "正在学", next: "mastered" },
  mastered: { label: "已掌握", next: "new" },
};
