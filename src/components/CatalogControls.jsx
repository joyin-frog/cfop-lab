import { useEffect, useId, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { ArrowDownWideNarrow, Check, ChevronDown, Filter, Search, SlidersHorizontal, Star, X } from "lucide-react";

export function CatalogSort({ stage, value, onValueChange }) {
  const options = [
    { value: "learning", label: "初学路线", hint: "按推荐学习顺序" },
    { value: "default", label: "形状分组", hint: "按识别轮廓归类" },
    ...(stage === "f2l" ? [] : [{ value: "probability", label: "概率从高到低", hint: "常见案例优先" }]),
    { value: "id", label: "编号顺序", hint: "按标准编号排列" },
  ];

  return (
    <div className="catalog-sort-control">
      <ArrowDownWideNarrow />
      <span>排序</span>
      <Select.Root value={value} onValueChange={onValueChange}>
        <Select.Trigger className="catalog-sort-trigger" aria-label="案例排序方式">
          <span className="catalog-sort-value">{options.find((option) => option.value === value)?.label}</span>
          <Select.Icon><ChevronDown /></Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="catalog-sort-menu" position="popper" sideOffset={8} align="end">
            <div className="catalog-sort-menu-heading">排列方式</div>
            <Select.Viewport>
              {options.map((option) => (
                <Select.Item className="catalog-sort-option" value={option.value} key={option.value}>
                  <Select.ItemText className="catalog-sort-option-copy">
                    <span><b>{option.label}</b><small>{option.hint}</small></span>
                  </Select.ItemText>
                  <Select.ItemIndicator className="catalog-sort-indicator"><Check /></Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

export function CatalogActions({
  stage,
  query,
  onQueryChange,
  results,
  totalCount,
  onSelectResult,
  activeFilterCount,
  onOpenFilters,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchPanelRef = useRef(null);
  const searchInputRef = useRef(null);
  const resultsId = useId();

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

  function selectResult(item) {
    setSearchOpen(false);
    onSelectResult(item);
  }

  return (
    <div className="header-actions">
      <div className={`global-search ${searchOpen ? "is-open" : ""}`} ref={searchPanelRef}>
        <button
          className={`header-action-button global-search-trigger ${query ? "has-value" : ""}`}
          type="button"
          aria-label="搜索全部案例"
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen((value) => !value)}
        >
          <Search />
        </button>

        <form
          className="global-search-form"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            if (results[0]) selectResult(results[0]);
          }}
        >
          <label className="global-search-field">
            <Search />
            <input
              ref={searchInputRef}
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => {
                onQueryChange(event.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(event) => event.key === "Escape" && setSearchOpen(false)}
              placeholder="搜索全部 F2L / OLL / PLL"
              aria-label="搜索全部 CFOP 案例"
              role="combobox"
              aria-expanded={searchOpen}
              aria-controls={resultsId}
              aria-autocomplete="list"
            />
            {query && (
              <button type="button" aria-label="清空搜索" onClick={() => onQueryChange("")}>
                <X />
              </button>
            )}
          </label>

          {searchOpen && (
            <div className="global-search-results" id={resultsId} role="listbox">
              <div className="global-search-heading">
                <span>GLOBAL SEARCH</span>
                <b>{query.trim() ? `${results.length} 个结果` : `${totalCount} 个案例`}</b>
              </div>
              {!query.trim() ? (
                <p className="global-search-empty">输入编号、名称、别名或公式，例如“OLL 27”或“小鱼”。</p>
              ) : results.length ? (
                <div className="global-search-list">
                  {results.map((item) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected="false"
                      key={`${item.stage}-${item.id}`}
                      onClick={() => selectResult(item)}
                    >
                      <img src={`/diagrams/${item.stage}-${item.id.toLowerCase()}.svg`} alt="" />
                      <span>
                        <b>{item.name}</b>
                        <small>{item.alias || item.group}</small>
                      </span>
                      <em>{item.stage.toUpperCase()} {item.id}</em>
                      <code>{item.algorithm}</code>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="global-search-empty"><strong>没有匹配案例</strong>试试更短的关键词或直接输入编号。</p>
              )}
              {results.length > 0 && <small className="global-search-tip">按 Enter 打开第一项</small>}
            </div>
          )}
        </form>
      </div>

      {stage !== "cross" && (
        <button
          className={`header-action-button mobile-filter-trigger ${activeFilterCount ? "has-value" : ""}`}
          type="button"
          aria-label="筛选案例"
          onClick={onOpenFilters}
        >
          <SlidersHorizontal />
          {activeFilterCount > 0 && <span className="action-count">{activeFilterCount}</span>}
        </button>
      )}
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
