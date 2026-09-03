import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, Filter, Search, SlidersHorizontal, Star, X } from "lucide-react";

export function CatalogActions({
  stage,
  query,
  onQueryChange,
  resultCount,
  activeFilterCount,
  onOpenFilters,
  onViewResults,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchPanelRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setSearchOpen(false);
  }, [stage]);

  useEffect(() => {
    if (!searchOpen) return undefined;

    searchInputRef.current?.focus();
    function closeOnOutsideClick(event) {
      if (!searchPanelRef.current?.contains(event.target)) setSearchOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [searchOpen]);

  if (stage === "cross") return <div className="header-actions" />;

  function viewResults() {
    setSearchOpen(false);
    onViewResults();
  }

  return (
    <div className="header-actions">
      <div className="header-search" ref={searchPanelRef}>
        <button
          className={`header-action-button ${query ? "has-value" : ""}`}
          type="button"
          aria-label="搜索案例"
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen((value) => !value)}
        >
          <Search />
        </button>

        {searchOpen && (
          <form
            className="header-search-panel"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              viewResults();
            }}
          >
            <div className="header-search-copy">
              <span>SEARCH CASES</span>
              <strong>搜索当前 {stage.toUpperCase()} 案例</strong>
            </div>
            <label className="header-search-field">
              <Search />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onKeyDown={(event) => event.key === "Escape" && setSearchOpen(false)}
                placeholder="编号、名称、别名或公式"
              />
              {query && (
                <button type="button" aria-label="清空搜索" onClick={() => onQueryChange("")}>
                  <X />
                </button>
              )}
            </label>
            <div className="header-search-footer">
              <span><b>{resultCount}</b> 个匹配案例</span>
              <button type="submit">查看结果</button>
            </div>
          </form>
        )}
      </div>

      <button
        className={`header-action-button mobile-filter-trigger ${activeFilterCount ? "has-value" : ""}`}
        type="button"
        aria-label="筛选案例"
        onClick={onOpenFilters}
      >
        <SlidersHorizontal />
        {activeFilterCount > 0 && <span className="action-count">{activeFilterCount}</span>}
      </button>
    </div>
  );
}

export function MobileFilterSheet({
  open,
  onOpenChange,
  statusFilters,
  statusFilter,
  onStatusFilterChange,
  groups,
  category,
  onCategoryChange,
  cases,
  resultCount,
  onReset,
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="filter-sheet-overlay" />
        <Dialog.Content className="filter-sheet-content">
          <div className="filter-sheet-handle" />
          <header className="filter-sheet-heading">
            <div>
              <span>FILTER CASES</span>
              <Dialog.Title>筛选案例</Dialog.Title>
            </div>
            <Dialog.Close aria-label="关闭筛选"><X /></Dialog.Close>
          </header>
          <Dialog.Description className="sr-only">按学习状态和形状分组筛选当前阶段的案例。</Dialog.Description>

          <section className="filter-sheet-section">
            <h3><Filter />学习状态</h3>
            <div className="sheet-filter-chips">
              {statusFilters.map((item) => (
                <button
                  className={statusFilter === item.id ? "is-active" : ""}
                  type="button"
                  key={item.id}
                  aria-pressed={statusFilter === item.id}
                  onClick={() => onStatusFilterChange(item.id)}
                >
                  {item.id === "favorite" && <Star />}
                  {item.label}
                  {statusFilter === item.id && <Check className="chip-check" />}
                </button>
              ))}
            </div>
          </section>

          <section className="filter-sheet-section sheet-categories">
            <h3><ChevronDown />形状分组</h3>
            <button
              className={category === "all" ? "is-active" : ""}
              type="button"
              onClick={() => onCategoryChange("all")}
            >
              <span>全部案例</span><b>{cases.length}</b>
            </button>
            {groups.map((group) => (
              <button
                className={category === group ? "is-active" : ""}
                type="button"
                key={group}
                onClick={() => onCategoryChange(group)}
              >
                <span>{group}</span><b>{cases.filter((item) => item.group === group).length}</b>
              </button>
            ))}
          </section>

          <footer className="filter-sheet-footer">
            <button type="button" className="filter-reset" onClick={onReset}>重置</button>
            <Dialog.Close className="filter-apply">查看 {resultCount} 个案例</Dialog.Close>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
