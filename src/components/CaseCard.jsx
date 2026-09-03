import { Check, Copy, Star } from "lucide-react";
import { CaseDiagram } from "./CaseDiagram";

export function CaseCard({ item, status, favorite, onOpen, onCycleStatus, onToggleFavorite, onCopy }) {

  return (
    <article className={`case-card status-${status}`}>
      <button className="case-visual" type="button" onClick={onOpen} aria-label={`打开 ${item.name}`}>
        <CaseDiagram stage={item.stage} caseId={item.id} label={`${item.name} 状态图`} />
      </button>
      <div className="case-body">
        <div className="case-kicker">
          <span>{item.stage.toUpperCase()} {item.id}</span>
          <button className={favorite ? "icon-button is-favorite" : "icon-button"} type="button" onClick={onToggleFavorite} aria-label="收藏">
            <Star />
          </button>
        </div>
        <button className="case-title" type="button" onClick={onOpen}>
          <strong>{item.name}</strong><small>{item.alias}</small>
        </button>
        <code className="formula-line">{item.algorithm}</code>
        <div className="case-actions">
          <button type="button" onClick={onCycleStatus}>{status === "mastered" && <Check />}{status === "mastered" ? "已掌握" : status === "learning" ? "正在学" : "标记进度"}</button>
          <button type="button" onClick={onCopy}><Copy />复制</button>
        </div>
      </div>
    </article>
  );
}
