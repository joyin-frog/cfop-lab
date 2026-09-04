import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, ChevronRight, Circle, Clock3, Flame, X } from "lucide-react";
import { CaseDiagram } from "./CaseDiagram";
import { AnimatedCube } from "./AnimatedCube";

const CURVE_POINTS = ["今天", "3 天", "7 天", "14 天", "30 天"];

export function DailyReviewDialog({ open, items, dueCount, learningCount, streak, onStart, onSnooze, onDismiss }) {
  const estimate = Math.max(1, Math.ceil(items.length * 0.65));
  const previewItem = items[0];

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onDismiss()}>
      <Dialog.Portal>
        <Dialog.Overlay className="daily-review-overlay" />
        <Dialog.Content className="daily-review-dialog">
          <Dialog.Close className="daily-review-close" aria-label="关闭今日回顾"><X /></Dialog.Close>

          {items.length ? (
            <>
              <div className="daily-review-layout">
                <section className="daily-review-copy">
                  <span className="daily-review-eyebrow">DAILY REVIEW</span>
                  <Dialog.Title>今天复习 <em>{items.length}</em> 个公式</Dialog.Title>
                  <Dialog.Description>预计 {estimate} 分钟，先复习到期案例，再继续学习清单。</Dialog.Description>

                  <div className="memory-curve" aria-label="记忆曲线：今天、3天、7天、14天、30天">
                    {CURVE_POINTS.map((point, index) => <span className={index === 0 ? "is-current" : ""} key={point}><Circle />{point}</span>)}
                  </div>

                  <div className="daily-queue">
                    <div className="daily-queue-heading"><strong>今日回顾队列</strong><small>{dueCount} 个到期 · {learningCount} 个学习中</small></div>
                    {items.slice(0, 3).map((item) => (
                      <div className="daily-queue-row" key={`${item.stage}-${item.id}`}>
                        <CaseDiagram stage={item.stage} caseId={item.id} label="" />
                        <b>{item.stage.toUpperCase()} {item.id}</b>
                        <span>{item.name}</span>
                        <ChevronRight />
                      </div>
                    ))}
                    {items.length > 3 && <div className="daily-queue-more">还有 {items.length - 3} 个 <ChevronDown /></div>}
                  </div>
                </section>

                <section className="daily-cube-preview" aria-label="今日第一个复习案例">
                  <ReviewCube item={previewItem} />
                  <span>{previewItem.stage.toUpperCase()} {previewItem.id}</span>
                  <strong>{previewItem.name}</strong>
                </section>
              </div>

              <footer className="daily-review-footer">
                <div className="review-streak"><Flame /><span>连续回顾 <b>{streak}</b> 天</span></div>
                <div className="daily-review-actions">
                  <button className="daily-snooze" type="button" onClick={onSnooze}>今天稍后提醒</button>
                  <button className="daily-start" type="button" onClick={onStart}><Clock3 />开始今日回顾</button>
                </div>
              </footer>
            </>
          ) : (
            <div className="daily-review-empty">
              <Check />
              <span className="daily-review-eyebrow">DAILY REVIEW</span>
              <Dialog.Title>今天已经没有待回顾公式</Dialog.Title>
              <Dialog.Description>继续学习新公式，或明天再回来看看。</Dialog.Description>
              <Dialog.Close>好的</Dialog.Close>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ReviewCube({ item }) {
  if (!item) return null;
  return <AnimatedCube algorithm={item.algorithm} stage={item.stage} label={`${item.name} 复习预览`} compact />;
}
