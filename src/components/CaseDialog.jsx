import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CalendarClock, Check, Copy, RefreshCcw, Repeat2, X } from "lucide-react";
import { AnimatedCube } from "./AnimatedCube";
import { invertAlgorithm } from "../lib/algorithms";
import { formatReviewDate, isReviewDue, progressStatus } from "../lib/progress";
import { formatProbability } from "../lib/probability";

export function CaseDialog({ item, progress, reviewSession, open, onOpenChange, onAddToLearning, onMarkMastered, onCompleteReview, onRateReview, onStartTraining }) {
  const [copied, setCopied] = useState("");
  const status = progressStatus(progress);
  const reviewDue = isReviewDue(progress);

  useEffect(() => setCopied(""), [item]);

  if (!item) return null;
  const setupAlgorithm = invertAlgorithm(item.algorithm);

  async function copy(value, type) {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(""), 1400);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="dialog-heading">
            <div className="dialog-heading-copy"><b>{reviewSession ? "DAILY REVIEW" : `${item.stage.toUpperCase()} ${item.id}`}</b><span>{reviewSession ? `${String(reviewSession.index + 1).padStart(2, "0")} / ${String(reviewSession.total).padStart(2, "0")}` : item.group}</span></div>
            <Dialog.Close className="dialog-close" aria-label="关闭详情"><X /></Dialog.Close>
          </div>

          <div className="dialog-layout">
            <section className="diagram-panel" aria-label="状态识别图">
              <AnimatedCube algorithm={item.algorithm} label={`${item.name} 公式动画`} />
            </section>

            <section className="lesson-panel">
              <Dialog.Title>{item.name}</Dialog.Title>
              <Dialog.Description>{item.alias}{formatProbability(item) && <span className="dialog-probability">出现概率 {formatProbability(item)}</span>}</Dialog.Description>
              <p className="lesson-lead">{item.recognition}</p>

              <div className="recognition-grid"><div><span>识别</span><p>{item.recognition}</p></div><div><span>拿法</span><p>{item.hold}</p></div></div>

              <div className="formula-card">
                <div className="formula-card-header">
                  <span>主公式 · TWO-HANDED</span>
                  <button type="button" onClick={() => copy(item.algorithm, "algorithm")}>
                    {copied === "algorithm" ? <Check /> : <Copy />}
                    {copied === "algorithm" ? "已复制" : "复制"}
                  </button>
                </div>
                <code className="dialog-formula">{item.algorithm}</code>
                <small className="formula-hint">左侧公式可逐步悬停演示</small>
              </div>
              {!reviewSession && <div className="setup-card">
                <div className="setup-card-heading">
                  <span>摆出此案例 · SETUP</span>
                  <button type="button" onClick={() => copy(setupAlgorithm, "setup")}>
                    {copied === "setup" ? <Check /> : <Copy />}
                    {copied === "setup" ? "已复制" : "复制摆型"}
                  </button>
                </div>
                <code>{setupAlgorithm}</code>
                <div className="setup-card-footer">
                  <small>从复原状态开始，黄面朝上执行</small>
                  <button type="button" onClick={onStartTraining}><Repeat2 />循环训练这条</button>
                </div>
              </div>}
              {item.alternatives?.length > 0 && <details className="alternative-card"><summary>其他顺手公式（{item.alternatives.length}）</summary>{item.alternatives.map((alg) => <code key={alg}>{alg}</code>)}</details>}
              {reviewSession ? (
                <div className="review-rating">
                  <div><span>凭第一感觉选择</span><b>这一步会决定下次出现时间</b></div>
                  <div className="review-rating-buttons">
                    <button type="button" onClick={() => onRateReview("again")}><strong>忘了</strong><small>明天再练</small></button>
                    <button type="button" onClick={() => onRateReview("hard")}><strong>有点犹豫</strong><small>缩短间隔</small></button>
                    <button type="button" className="is-good" onClick={() => onRateReview("good")}><strong>很顺手</strong><small>延长间隔</small></button>
                  </div>
                </div>
              ) : <div className="progress-actions">
                {reviewDue ? (
                  <button className="master-button review" type="button" onClick={onCompleteReview}><RefreshCcw />完成本次复习</button>
                ) : status === "mastered" ? (
                  <div className="mastered-status"><Check /><span><strong>已掌握</strong><small><CalendarClock />{formatReviewDate(progress)}</small></span></div>
                ) : (
                  <button className="master-button" type="button" onClick={status === "learning" ? onMarkMastered : onAddToLearning}>{status === "learning" ? "标记为已掌握" : "加入学习清单"}</button>
                )}
                {status === "mastered" && <button className="relearn-button" type="button" onClick={onAddToLearning}>重新学习</button>}
              </div>}
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
