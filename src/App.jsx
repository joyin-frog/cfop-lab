import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, ChevronDown, Copy, Dumbbell, Filter, Info, Menu, Search, Settings2, Shuffle, Star, Target, X } from "lucide-react";
import { CaseCard } from "./components/CaseCard";
import { CaseDialog } from "./components/CaseDialog";
import { CaseTrainerDialog } from "./components/CaseTrainerDialog";
import { CatalogActions, CatalogSort, MobileFilterSheet } from "./components/CatalogControls";
import { DailyReviewDialog } from "./components/DailyReviewDialog";
import { LearningPathBanner } from "./components/LearningPathBanner";
import { casesByStage, crossLessons, stageMeta } from "./data/cfopData";
import { compareLearningOrder, learningPaths } from "./data/learningPath";
import { completeReview, isReviewDue, markMastered, progressStatus, rateReview, startLearning } from "./lib/progress";
import { compareProbability } from "./lib/probability";
import { searchCases } from "./lib/search";

const STAGES = ["cross", "f2l", "oll", "pll"];
const STATUS_FILTERS = [{ id: "all", label: "全部" }, { id: "learning", label: "学习清单" }, { id: "review", label: "需要复习" }, { id: "mastered", label: "已掌握" }, { id: "favorite", label: "收藏" }];
const ALL_CASES = Object.values(casesByStage).flat();
const DAILY_LIMIT = 6;
const SNOOZE_MS = 4 * 60 * 60 * 1000;

function loadJSON(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } }
function loadArray(key) { const value = loadJSON(key); return Array.isArray(value) ? value : []; }
function progressKey(item) { return `${item.stage}-${item.id}`; }
function localDateKey(date = new Date()) { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, "0"); const day = String(date.getDate()).padStart(2, "0"); return `${year}-${month}-${day}`; }
function calculateStreak(history) { const completed = new Set(history); const cursor = new Date(); if (!completed.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1); let streak = 0; while (completed.has(localDateKey(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); } return streak; }

export default function App() {
  const [stage, setStage] = useState("oll");
  const [progress, setProgress] = useState(() => loadJSON("cfop-lab-progress"));
  const [favorites, setFavorites] = useState(() => loadJSON("cfop-lab-favorites"));
  const [statusFilter, setStatusFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("learning");
  const [selected, setSelected] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [copied, setCopied] = useState("");
  const [dailyReviewOpen, setDailyReviewOpen] = useState(false);
  const [reviewSession, setReviewSession] = useState(null);
  const [reviewHistory, setReviewHistory] = useState(() => loadArray("cfop-lab-review-history"));
  const [reviewComplete, setReviewComplete] = useState(false);
  const [trainingSession, setTrainingSession] = useState(null);
  const cases = casesByStage[stage] || [];
  const groups = useMemo(() => [...new Set(cases.map((item) => item.group))], [cases]);
  const globalSearchResults = useMemo(() => searchCases(ALL_CASES, query, stageMeta), [query]);
  const visible = useMemo(() => {
    const matching = cases.filter((item) => {
      const key = progressKey(item); const state = progressStatus(progress[key]);
      const stateMatch = statusFilter === "all" || (statusFilter === "favorite" ? favorites[key] : statusFilter === "review" ? isReviewDue(progress[key]) : state === statusFilter);
      const categoryMatch = category === "all" || item.group === category;
      return stateMatch && categoryMatch;
    });
    if (sortOrder === "learning") return [...matching].sort((first, second) => compareLearningOrder(stage, first, second));
    if (sortOrder === "probability") return [...matching].sort(compareProbability);
    if (sortOrder === "id") return [...matching].sort((first, second) => first.id.localeCompare(second.id, undefined, { numeric: true }));
    return matching;
  }, [cases, category, favorites, progress, sortOrder, stage, statusFilter]);
  const mastered = cases.filter((item) => progressStatus(progress[progressKey(item)]) === "mastered").length;
  const learningItems = cases.filter((item) => progressStatus(progress[progressKey(item)]) === "learning");
  const reviewItems = cases.filter((item) => isReviewDue(progress[progressKey(item)]));
  const allReviewItems = ALL_CASES.filter((item) => isReviewDue(progress[progressKey(item)]));
  const allLearningItems = ALL_CASES.filter((item) => progressStatus(progress[progressKey(item)]) === "learning");
  const dailyReviewItems = [...allReviewItems, ...allLearningItems].slice(0, DAILY_LIMIT);
  const dailyDueCount = dailyReviewItems.filter((item) => isReviewDue(progress[progressKey(item)])).length;
  const dailyLearningCount = dailyReviewItems.length - dailyDueCount;
  const trainingItems = [...allReviewItems, ...allLearningItems];
  const grouped = sortOrder === "learning"
    ? learningPaths[stage].milestones.map((milestone) => ({ group: milestone.title, description: milestone.description, items: visible.filter((item) => milestone.caseIds?.includes(item.id)) })).filter((entry) => entry.items.length)
    : sortOrder === "default"
      ? groups.map((group) => ({ group, items: visible.filter((item) => item.group === group) })).filter((entry) => entry.items.length)
      : visible.length ? [{ group: sortOrder === "probability" ? "按出现概率从高到低" : "按编号排列", items: visible }] : [];
  const meta = stageMeta[stage];
  const activeFilterCount = Number(statusFilter !== "all") + Number(category !== "all");

  useEffect(() => {
    if (!dailyReviewItems.length) return undefined;
    const today = localDateKey();
    if (reviewHistory.includes(today) || localStorage.getItem("cfop-lab-review-dismissed") === today) return undefined;
    const snoozeUntil = Number(localStorage.getItem("cfop-lab-review-snooze") || 0);
    const shownToday = localStorage.getItem("cfop-lab-review-shown") === today;
    if (shownToday && !snoozeUntil) return undefined;
    const delay = snoozeUntil > Date.now() ? snoozeUntil - Date.now() : 700;
    const timer = window.setTimeout(() => {
      if (localStorage.getItem("cfop-lab-review-dismissed") === today || loadArray("cfop-lab-review-history").includes(today)) return;
      setDailyReviewOpen(true);
      localStorage.setItem("cfop-lab-review-shown", today);
      localStorage.removeItem("cfop-lab-review-snooze");
    }, delay);
    return () => window.clearTimeout(timer);
  }, []);

  function changeStage(next) { setStage(next); setCategory("all"); setStatusFilter("all"); setSortOrder("learning"); setQuery(""); setMobileNav(false); setMobileFilters(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function openGlobalSearchResult(item) { setStage(item.stage); setCategory("all"); setStatusFilter("all"); setSortOrder("learning"); setQuery(""); setMobileNav(false); setMobileFilters(false); setSelected(item); }
  function continueLearning(item) {
    if (stage === "cross") { alert("训练建议：打乱魔方后不限时观察，闭眼口述四条白棱的顺序，再连续完成十字。"); return; }
    if (item) setSelected(item);
  }
  function updateProgress(item, updater) { const key = progressKey(item); setProgress((current) => { const next = { ...current, [key]: updater(current[key]) }; localStorage.setItem("cfop-lab-progress", JSON.stringify(next)); return next; }); }
  function addToLearning(item) { updateProgress(item, startLearning); }
  function setMastered(item) { updateProgress(item, markMastered); }
  function finishReview(item) { updateProgress(item, completeReview); }
  function dismissDailyReview() { localStorage.setItem("cfop-lab-review-dismissed", localDateKey()); setDailyReviewOpen(false); }
  function snoozeDailyReview() { const snoozeUntil = Date.now() + SNOOZE_MS; const today = localDateKey(); localStorage.setItem("cfop-lab-review-snooze", String(snoozeUntil)); setDailyReviewOpen(false); window.setTimeout(() => { if (localStorage.getItem("cfop-lab-review-dismissed") !== today && !loadArray("cfop-lab-review-history").includes(today)) setDailyReviewOpen(true); }, SNOOZE_MS); }
  function startDailyReview() { if (!dailyReviewItems.length) return; setDailyReviewOpen(false); setReviewSession({ items: dailyReviewItems, index: 0 }); setSelected(dailyReviewItems[0]); }
  function rateCurrentReview(rating) {
    if (!selected || !reviewSession) return;
    updateProgress(selected, (value) => rateReview(value, rating));
    const nextIndex = reviewSession.index + 1;
    if (nextIndex < reviewSession.items.length) {
      setReviewSession({ ...reviewSession, index: nextIndex });
      setSelected(reviewSession.items[nextIndex]);
      return;
    }
    const today = localDateKey();
    const nextHistory = [...new Set([...reviewHistory, today])];
    localStorage.setItem("cfop-lab-review-history", JSON.stringify(nextHistory));
    localStorage.setItem("cfop-lab-review-dismissed", today);
    setReviewHistory(nextHistory);
    setReviewSession(null);
    setSelected(null);
    setReviewComplete(true);
    window.setTimeout(() => setReviewComplete(false), 2200);
  }
  function startTraining(items, mode, title) {
    const pool = items.filter(Boolean);
    if (!pool.length) return;
    setSelected(null);
    setReviewSession(null);
    setTrainingSession({ id: Date.now(), items: pool, mode, title });
  }
  function rateTraining(item, rating) { updateProgress(item, (value) => rateReview(value, rating)); }
  function toggleFavorite(item) { const key = progressKey(item); setFavorites((current) => { const next = { ...current, [key]: !current[key] }; localStorage.setItem("cfop-lab-favorites", JSON.stringify(next)); return next; }); }
  async function copyAlgorithm(item) { await navigator.clipboard.writeText(item.algorithm); setCopied(progressKey(item)); window.setTimeout(() => setCopied(""), 1200); }

  return <div className="app-shell">
    <header className="site-header">
      <button className="mobile-menu" type="button" onClick={() => setMobileNav((value) => !value)} aria-label="打开菜单">{mobileNav ? <X /> : <Menu />}</button>
      <a className="site-brand" href="#top"><Logo /><span><strong>CFOP LAB</strong><small>三阶速拧学习库</small></span></a>
      <nav className={mobileNav ? "main-nav is-open" : "main-nav"} aria-label="CFOP 阶段">{STAGES.map((item) => <button className={stage === item ? "is-active" : ""} key={item} type="button" onClick={() => changeStage(item)}>{stageMeta[item].label}<small>{stageMeta[item].title}</small></button>)}</nav>
      <CatalogActions
        stage={stage}
        query={query}
        onQueryChange={setQuery}
        results={globalSearchResults}
        totalCount={ALL_CASES.length}
        onSelectResult={openGlobalSearchResult}
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setMobileFilters(true)}
      />
    </header>

    <div className="page" id="top">
      <aside className="catalog-sidebar">
        <div className="sidebar-heading"><span>CASE LIBRARY</span><strong>{meta.title}</strong><small>{mastered} / {cases.length || 4} 已掌握</small></div>
        {stage !== "cross" ? <>
          <div className="sidebar-block"><p><Filter />学习状态</p><div className="filter-chips">{STATUS_FILTERS.map((item) => <button className={statusFilter === item.id ? "is-active" : ""} type="button" key={item.id} onClick={() => setStatusFilter(item.id)}>{item.id === "favorite" && <Star />}{item.label}</button>)}</div></div>
          <div className="sidebar-block category-list"><p><ChevronDown />形状分组</p><button className={category === "all" ? "is-active" : ""} type="button" onClick={() => setCategory("all")}><span>全部案例</span><b>{cases.length}</b></button>{groups.map((group) => <button className={category === group ? "is-active" : ""} type="button" key={group} onClick={() => setCategory(group)}><span>{group}</span><b>{cases.filter((item) => item.group === group).length}</b></button>)}</div>
          <section className="practice-hub" aria-label="今日训练">
            <div className="practice-hub-heading"><span>TODAY</span><strong>今天练什么</strong></div>
            <button className="drill-button study-drill" type="button" onClick={() => setDailyReviewOpen(true)}><CalendarDays /><span><strong>每日回顾</strong><small>{dailyReviewItems.length ? `${dailyReviewItems.length} 个公式 · 约 ${Math.max(1, Math.ceil(dailyReviewItems.length * .65))} 分钟` : "今天没有待回顾公式"}</small></span></button>
            <button className="queue-drill-button" type="button" disabled={!trainingItems.length} onClick={() => startTraining(trainingItems, "queue", "学习清单抽题")}><Dumbbell /><span><strong>训练学习清单</strong><small>{trainingItems.length ? `${trainingItems.length} 个待练案例` : "先把案例加入学习清单"}</small></span></button>
            <button className="random-drill-button" type="button" disabled={!visible.length} onClick={() => startTraining(visible, "queue", "当前筛选训练")}><Shuffle />训练当前筛选 · {visible.length}</button>
            <p className="practice-hub-help">清单＝正在学 · 复习＝已到期 · 掌握＝进入记忆曲线</p>
          </section>
          <div className="mini-grid">{visible.slice(0, 24).map((item) => <button type="button" key={progressKey(item)} onClick={() => setSelected(item)}><img src={`/diagrams/${stage}-${item.id.toLowerCase()}.svg`} alt="" /><span>{item.id}</span></button>)}</div>
        </> : <div className="sidebar-note"><Target /><strong>十字不靠公式表</strong><p>这一步重点是观察、步数和连续执行。先把无限观察做到 8 步内，再压缩进 15 秒。</p></div>}
      </aside>

      <main className="content" id="catalog">
        <div className="breadcrumb">三阶 <span>/</span> CFOP <span>/</span> {meta.label}</div>
        <section className="page-intro"><div><span className="eyebrow">3×3 SPEEDCUBING</span><h1>{meta.label}<small>{meta.title}</small></h1><p>{meta.description}</p></div><div className="stage-count"><span>{meta.count}</span><small>{stage === "cross" ? "训练原则" : "标准案例"}</small></div></section>
        <section className="explainers">
          <details open><summary><BookOpen />这一阶段解决什么？<ChevronDown /></summary><p>{meta.description}</p></details>
          <details><summary><Target />学习顺序建议<ChevronDown /></summary><p>{stage === "f2l" ? "先练基础插入和顶层配对，再处理错误配对与槽内案例。F2L 仍应以直觉为主。" : stage === "oll" ? "先熟练二步 OLL 的十字与 7 种角块定向，再按形状补齐完整 OLL。" : stage === "pll" ? "先掌握 Ua、Ub、H、Z 与 T，再补角换和 G/N 等混合交换。" : "先不限时规划四条白棱，再逐步减少观察和停顿。"}</p></details>
          <details><summary><Settings2 />公式怎么记？<ChevronDown /></summary><p>先理解块的移动目的，再把公式切成常见手法。最终会形成肌肉记忆，但识别和拿法必须保持清楚。</p></details>
        </section>
        <LearningPathBanner stage={stage} path={learningPaths[stage]} cases={cases} progress={progress} onContinue={continueLearning} />
        {stage === "cross" ? <CrossSection /> : <>
          {dailyReviewItems.length > 0 && <button className="mobile-practice-button" type="button" onClick={() => setDailyReviewOpen(true)}><CalendarDays /><span><strong>打开每日回顾</strong><small>{dailyReviewItems.length} 个案例</small></span></button>}
          {trainingItems.length > 0 && <button className="mobile-practice-button mobile-training-button" type="button" onClick={() => startTraining(trainingItems, "queue", "学习清单抽题")}><Dumbbell /><span><strong>训练学习清单</strong><small>{trainingItems.length} 个案例</small></span></button>}
          {activeFilterCount > 0 && <div className="active-catalog-filters"><span>已应用 {activeFilterCount} 项筛选</span><button type="button" onClick={() => { setStatusFilter("all"); setCategory("all"); }}>清除全部</button></div>}
          <div className="catalog-orderbar">
            <p><Info />{stage === "f2l" ? "F2L 的实战频率取决于解槽顺序，不展示伪精确概率。" : `基于随机合法 ${stage.toUpperCase()} 状态的理论概率，统计包含跳过情况。`}</p>
            <CatalogSort stage={stage} value={sortOrder} onValueChange={setSortOrder} />
          </div>
          <div className="catalog-title" id="catalog-results"><div><span>ALGORITHM CATALOG</span><h2>{meta.subtitle}</h2></div><div className="catalog-summary"><b>{visible.length}</b><span>当前显示</span></div></div>
          {grouped.length ? grouped.map(({ group, description, items }) => <section className="case-group" key={group}><div className="group-heading"><div><h3>{group}</h3>{description && <p>{description}</p>}</div><span>{items.length} CASES</span></div><div className="case-grid">{items.map((item) => { const entry = progress[progressKey(item)]; return <CaseCard key={progressKey(item)} item={item} status={progressStatus(entry)} reviewDue={isReviewDue(entry)} favorite={favorites[progressKey(item)]} onOpen={() => setSelected(item)} onAddToLearning={() => addToLearning(item)} onMarkMastered={() => setMastered(item)} onToggleFavorite={() => toggleFavorite(item)} onCopy={() => copyAlgorithm(item)} />; })}</div></section>) : <div className="empty-state"><Search /><strong>没有符合筛选的案例</strong><p>换一个分组或清除筛选试试。</p></div>}
        </>}
        <footer className="site-footer"><div><Logo small /><strong>CFOP LAB</strong></div><p>进度只保存在当前浏览器 · <a href="/THIRD_PARTY_NOTICES.txt" target="_blank" rel="noreferrer">第三方许可</a></p></footer>
      </main>
    </div>
    {copied && <div className="toast"><Copy />公式已复制</div>}
    {reviewComplete && <div className="toast review-toast"><CalendarDays />今日回顾完成</div>}
    <MobileFilterSheet
      open={mobileFilters}
      onOpenChange={setMobileFilters}
      statusFilters={STATUS_FILTERS}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      groups={groups}
      category={category}
      onCategoryChange={setCategory}
      cases={cases}
      resultCount={visible.length}
      onReset={() => { setStatusFilter("all"); setCategory("all"); }}
    />
    <DailyReviewDialog open={dailyReviewOpen} items={dailyReviewItems} dueCount={dailyDueCount} learningCount={dailyLearningCount} streak={calculateStreak(reviewHistory)} onStart={startDailyReview} onSnooze={snoozeDailyReview} onDismiss={dismissDailyReview} />
    <CaseDialog item={selected} progress={selected ? progress[progressKey(selected)] : null} reviewSession={reviewSession ? { index: reviewSession.index, total: reviewSession.items.length } : null} open={Boolean(selected)} onOpenChange={(open) => { if (!open) { setSelected(null); setReviewSession(null); } }} onAddToLearning={() => selected && addToLearning(selected)} onMarkMastered={() => selected && setMastered(selected)} onCompleteReview={() => selected && finishReview(selected)} onRateReview={rateCurrentReview} onStartTraining={() => selected && startTraining([selected], "single", `${selected.stage.toUpperCase()} ${selected.id} · 单案例循环`)} />
    <CaseTrainerDialog session={trainingSession} progress={progress} onOpenChange={(open) => !open && setTrainingSession(null)} onRate={rateTraining} />
  </div>;
}

function Logo({ small = false }) { return <span className={`logo-grid ${small ? "small" : ""}`}>{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</span>; }
function CrossSection() { return <><div className="cross-hero"><div><span>INSPECTION DRILL</span><h2>白十字，先在脑中完成。</h2><p>拿起魔方前，把四条白棱的位置、顺序和可能冲突看清。练习时允许无限观察，但落手后不要停。</p><button type="button" onClick={() => alert("训练建议：打乱魔方后不限时观察，闭眼口述四条白棱的顺序，再连续完成十字。")}>开始一次规划训练</button></div><div className="cross-target"><span>≤ 8</span><small>步完成十字</small><i /><b>15 秒内完整规划</b></div></div><div className="cross-lessons">{crossLessons.map((lesson) => <article key={lesson.id}><span>{lesson.id}</span><small>{lesson.tag}</small><h3>{lesson.title}</h3><p>{lesson.text}</p></article>)}</div></>; }
