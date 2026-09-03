import { BookOpen, Check, Copy, RefreshCcw, Star } from "lucide-react";
import { CaseDiagram } from "./CaseDiagram";
import { formatProbability } from "../lib/probability";

export function CaseCard({ item, status, reviewDue, favorite, onOpen, onAddToLearning, onMarkMastered, onToggleFavorite, onCopy }) {
  const progressAction = reviewDue ? onOpen : status === "new" ? onAddToLearning : status === "learning" ? onMarkMastered : onOpen;
  const progressLabel = reviewDue ? "需要复习" : status === "mastered" ? "已掌握" : status === "learning" ? "标记已掌握" : "加入学习清单";
  const probability = formatProbability(item);

  return (
    <article className={`case-card status-${reviewDue ? "review" : status}`}>
      <button className="case-visual" type="button" onClick={onOpen} aria-label={`打开 ${item.name}`}>
        <CaseDiagram stage={item.stage} caseId={item.id} label={`${item.name} 状态图`} />
      </button>
      <div className="case-body">
        <div className="case-kicker">
          <span className="case-kicker-meta"><span>{item.stage.toUpperCase()} {item.id}</span>{probability && <small title="随机合法顶层状态中的理论出现概率">{probability}</small>}</span>
          <button className={favorite ? "icon-button is-favorite" : "icon-button"} type="button" onClick={onToggleFavorite} aria-label="收藏">
            <Star />
          </button>
        </div>
        <button className="case-title" type="button" onClick={onOpen}>
          <strong>{item.name}</strong><small>{item.alias}</small>
        </button>
        <code className="formula-line">{item.algorithm}</code>
        <div className="case-actions">
          <button type="button" onClick={progressAction}>
            {reviewDue ? <RefreshCcw /> : status === "mastered" ? <Check /> : status === "learning" ? <BookOpen /> : null}
            {progressLabel}
          </button>
          <button type="button" onClick={onCopy}><Copy />复制</button>
        </div>
      </div>
    </article>
  );
}
