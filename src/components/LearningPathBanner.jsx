import { ArrowRight, Check, Route, Sparkles } from "lucide-react";
import { progressStatus } from "../lib/progress";

export function LearningPathBanner({ stage, path, cases, progress, onContinue }) {
  const caseMap = new Map(cases.map((item) => [item.id, item]));
  const stats = path.milestones.map((milestone) => {
    const items = (milestone.caseIds || []).map((id) => caseMap.get(id)).filter(Boolean);
    const mastered = items.filter((item) => progressStatus(progress[`${stage}-${item.id}`]) === "mastered").length;
    return { ...milestone, items, mastered, complete: items.length > 0 && mastered === items.length };
  });
  const trackable = stats.filter((milestone) => milestone.items.length > 0);
  const total = trackable.reduce((sum, milestone) => sum + milestone.items.length, 0);
  const mastered = trackable.reduce((sum, milestone) => sum + milestone.mastered, 0);
  const current = trackable.find((milestone) => !milestone.complete);
  const nextItem = current?.items.find((item) => progressStatus(progress[`${stage}-${item.id}`]) !== "mastered");
  const percent = total ? Math.round(mastered / total * 100) : 0;

  return (
    <section className="learning-path-banner" aria-label={`${stage.toUpperCase()} 初学路线`}>
      <div className="learning-path-heading">
        <div>
          <span><Route />CFOP STAGE · {path.step}</span>
          <h2>{path.title}</h2>
          <p>{path.description}</p>
        </div>
        {path.prerequisite && <small><Sparkles />{path.prerequisite}</small>}
      </div>

      <small className="learning-path-scroll-hint">左右滑动查看完整路线</small>
      <div className="learning-milestones">
        {stats.map((milestone, index) => {
          const active = milestone === current || (!current && index === stats.length - 1);
          return <div className={`${milestone.complete ? "is-complete" : ""} ${active ? "is-active" : ""}`} key={milestone.title}>
            <i>{milestone.complete ? <Check /> : String(index + 1).padStart(2, "0")}</i>
            <span><strong>{milestone.title}</strong><small>{milestone.items.length ? `${milestone.mastered} / ${milestone.items.length}` : milestone.description}</small></span>
          </div>;
        })}
      </div>

      <footer className="learning-path-footer">
        <div><span>本阶段进度</span><b>{total ? `${mastered} / ${total}` : "直觉训练"}</b><em><i style={{ width: `${percent}%` }} /></em></div>
        <button type="button" disabled={!nextItem && stage !== "cross"} onClick={() => onContinue(nextItem)}>{nextItem ? `继续 ${stage.toUpperCase()} ${nextItem.id}` : stage === "cross" ? "开始十字训练" : "本阶段已完成"}<ArrowRight /></button>
      </footer>
    </section>
  );
}
