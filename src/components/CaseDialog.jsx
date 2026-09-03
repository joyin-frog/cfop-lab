import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, X } from "lucide-react";
import { AnimatedCube } from "./AnimatedCube";

export function CaseDialog({ item, status, open, onOpenChange, onCycleStatus }) {
  const [copied, setCopied] = useState("");

  useEffect(() => setCopied(""), [item]);

  if (!item) return null;

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
            <div className="dialog-heading-copy"><b>{item.stage.toUpperCase()} {item.id}</b><span>{item.group}</span></div>
            <Dialog.Close className="dialog-close" aria-label="关闭详情"><X /></Dialog.Close>
          </div>

          <div className="dialog-layout">
            <section className="diagram-panel" aria-label="状态识别图">
              <AnimatedCube algorithm={item.algorithm} label={`${item.name} 公式动画`} />
            </section>

            <section className="lesson-panel">
              <Dialog.Title>{item.name}</Dialog.Title>
              <Dialog.Description>{item.alias}</Dialog.Description>
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
              {item.alternatives?.length > 0 && <details className="alternative-card"><summary>其他顺手公式（{item.alternatives.length}）</summary>{item.alternatives.map((alg) => <code key={alg}>{alg}</code>)}</details>}
              <button className={`master-button ${status === "mastered" ? "done" : ""}`} type="button" onClick={onCycleStatus}>{status === "mastered" ? <><Check />已掌握，点击重置</> : status === "learning" ? "标记为已掌握" : "加入正在学习"}</button>
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
