import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, Copy, Filter, Menu, Search, Settings2, Shuffle, Sparkles, Star, Target, X } from "lucide-react";
import { CaseCard } from "./components/CaseCard";
import { CaseDialog } from "./components/CaseDialog";
import { CatalogActions, MobileFilterSheet } from "./components/CatalogControls";
import { casesByStage, crossLessons, stageMeta, statusMeta } from "./data/cfopData";

const STAGES = ["cross", "f2l", "oll", "pll"];
const STATUS_FILTERS = [{ id: "all", label: "全部" }, { id: "learning", label: "正在学" }, { id: "mastered", label: "已掌握" }, { id: "favorite", label: "收藏" }];

function loadJSON(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } }
function progressKey(item) { return `${item.stage}-${item.id}`; }

export default function App() {
  const [stage, setStage] = useState("oll");
  const [progress, setProgress] = useState(() => loadJSON("cfop-lab-progress"));
  const [favorites, setFavorites] = useState(() => loadJSON("cfop-lab-favorites"));
  const [statusFilter, setStatusFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [copied, setCopied] = useState("");
  const cases = casesByStage[stage] || [];
  const groups = useMemo(() => [...new Set(cases.map((item) => item.group))], [cases]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return cases.filter((item) => {
      const key = progressKey(item); const state = progress[key] || "new";
      const stateMatch = statusFilter === "all" || (statusFilter === "favorite" ? favorites[key] : state === statusFilter);
      const categoryMatch = category === "all" || item.group === category;
      return stateMatch && categoryMatch && `${item.id} ${item.name} ${item.alias} ${item.group} ${item.algorithm}`.toLowerCase().includes(needle);
    });
  }, [cases, category, favorites, progress, query, statusFilter]);
  const mastered = cases.filter((item) => progress[progressKey(item)] === "mastered").length;
  const grouped = groups.map((group) => ({ group, items: visible.filter((item) => item.group === group) })).filter((entry) => entry.items.length);
  const meta = stageMeta[stage];
  const activeFilterCount = Number(statusFilter !== "all") + Number(category !== "all");

  function changeStage(next) { setStage(next); setCategory("all"); setStatusFilter("all"); setQuery(""); setMobileNav(false); setMobileFilters(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function cycleStatus(item) { const key = progressKey(item); setProgress((current) => { const next = { ...current, [key]: statusMeta[current[key] || "new"].next }; localStorage.setItem("cfop-lab-progress", JSON.stringify(next)); return next; }); }
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
        resultCount={visible.length}
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setMobileFilters(true)}
        onViewResults={() => document.querySelector("#catalog-results")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />
    </header>

    <div className="page" id="top">
      <aside className="catalog-sidebar">
        <div className="sidebar-heading"><span>CASE LIBRARY</span><strong>{meta.title}</strong><small>{mastered} / {cases.length || 4} 已掌握</small></div>
        {stage !== "cross" ? <>
          <label className="sidebar-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索编号、名称或公式" /></label>
          <div className="sidebar-block"><p><Filter />学习状态</p><div className="filter-chips">{STATUS_FILTERS.map((item) => <button className={statusFilter === item.id ? "is-active" : ""} type="button" key={item.id} onClick={() => setStatusFilter(item.id)}>{item.id === "favorite" && <Star />}{item.label}</button>)}</div></div>
          <div className="sidebar-block category-list"><p><ChevronDown />形状分组</p><button className={category === "all" ? "is-active" : ""} type="button" onClick={() => setCategory("all")}><span>全部案例</span><b>{cases.length}</b></button>{groups.map((group) => <button className={category === group ? "is-active" : ""} type="button" key={group} onClick={() => setCategory(group)}><span>{group}</span><b>{cases.filter((item) => item.group === group).length}</b></button>)}</div>
          <button className="drill-button" type="button" onClick={() => setSelected(visible[Math.floor(Math.random() * visible.length)] || cases[0])}><Shuffle /><span><strong>随机抽一题</strong><small>从当前筛选中练习</small></span></button>
          <div className="mini-grid">{visible.slice(0, 24).map((item) => <button type="button" key={progressKey(item)} onClick={() => setSelected(item)}><img src={`/diagrams/${stage}-${item.id.toLowerCase()}.svg`} alt="" /><span>{item.id}</span></button>)}</div>
        </> : <div className="sidebar-note"><Target /><strong>十字不靠公式表</strong><p>这一步重点是观察、步数和连续执行。先把无限观察做到 8 步内，再压缩进 15 秒。</p></div>}
      </aside>

      <main className="content" id="catalog">
        <div className="breadcrumb">三阶 <span>/</span> CFOP <span>/</span> {meta.label}</div>
        <section className="page-intro"><div><span className="eyebrow"><Sparkles />3×3 SPEEDCUBING</span><h1>{meta.label}<small>{meta.title}</small></h1><p>{meta.description}</p></div><div className="stage-count"><span>{meta.count}</span><small>{stage === "cross" ? "训练原则" : "标准案例"}</small></div></section>
        <section className="explainers">
          <details open><summary><BookOpen />这一阶段解决什么？<ChevronDown /></summary><p>{meta.description}</p></details>
          <details><summary><Target />学习顺序建议<ChevronDown /></summary><p>{stage === "f2l" ? "先练基础插入和顶层配对，再处理错误配对与槽内案例。F2L 仍应以直觉为主。" : stage === "oll" ? "先熟练二步 OLL 的十字与 7 种角块定向，再按形状补齐完整 OLL。" : stage === "pll" ? "先掌握 Ua、Ub、H、Z 与 T，再补角换和 G/N 等混合交换。" : "先不限时规划四条白棱，再逐步减少观察和停顿。"}</p></details>
          <details><summary><Settings2 />公式怎么记？<ChevronDown /></summary><p>先理解块的移动目的，再把公式切成常见手法。最终会形成肌肉记忆，但识别和拿法必须保持清楚。</p></details>
        </section>
        {stage === "cross" ? <CrossSection /> : <>
          {(query || activeFilterCount > 0) && <div className="active-catalog-filters"><span>已应用 {Number(Boolean(query)) + activeFilterCount} 项条件</span><button type="button" onClick={() => { setQuery(""); setStatusFilter("all"); setCategory("all"); }}>清除全部</button></div>}
          <div className="catalog-title" id="catalog-results"><div><span>ALGORITHM CATALOG</span><h2>{meta.subtitle}</h2></div><div className="catalog-summary"><b>{visible.length}</b><span>当前显示</span></div></div>
          {grouped.length ? grouped.map(({ group, items }) => <section className="case-group" key={group}><div className="group-heading"><h3>{group}</h3><span>{items.length} CASES</span></div><div className="case-grid">{items.map((item) => <CaseCard key={progressKey(item)} item={item} status={progress[progressKey(item)] || "new"} favorite={favorites[progressKey(item)]} onOpen={() => setSelected(item)} onCycleStatus={() => cycleStatus(item)} onToggleFavorite={() => toggleFavorite(item)} onCopy={() => copyAlgorithm(item)} />)}</div></section>) : <div className="empty-state"><Search /><strong>没有匹配的案例</strong><p>换一个分组或清空搜索试试。</p></div>}
        </>}
        <footer className="site-footer"><div><Logo small /><strong>CFOP LAB</strong></div><p>先理解，再重复，最后让手自己完成。</p></footer>
      </main>
    </div>
    {copied && <div className="toast"><Copy />公式已复制</div>}
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
    <CaseDialog item={selected} status={selected ? progress[progressKey(selected)] || "new" : "new"} open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} onCycleStatus={() => selected && cycleStatus(selected)} />
  </div>;
}

function Logo({ small = false }) { return <span className={`logo-grid ${small ? "small" : ""}`}>{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</span>; }
function CrossSection() { return <><div className="cross-hero"><div><span>INSPECTION DRILL</span><h2>白十字，先在脑中完成。</h2><p>拿起魔方前，把四条白棱的位置、顺序和可能冲突看清。练习时允许无限观察，但落手后不要停。</p><button type="button" onClick={() => alert("训练建议：打乱魔方后不限时观察，闭眼口述四条白棱的顺序，再连续完成十字。")}>开始一次规划训练</button></div><div className="cross-target"><span>≤ 8</span><small>步完成十字</small><i /><b>15 秒内完整规划</b></div></div><div className="cross-lessons">{crossLessons.map((lesson) => <article key={lesson.id}><span>{lesson.id}</span><small>{lesson.tag}</small><h3>{lesson.title}</h3><p>{lesson.text}</p></article>)}</div></>; }
