import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Clock3, Copy, Eye, RefreshCcw, ScanSearch, Shuffle, X } from "lucide-react";
import { AnimatedCube } from "./AnimatedCube";
import { AUF_OPTIONS, trainingAlgorithms } from "../lib/algorithms";

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function nextAuf(previous = "") {
  const options = AUF_OPTIONS.filter((value) => value !== previous);
  return options[Math.floor(Math.random() * options.length)];
}

export function CaseTrainerDialog({ session, onOpenChange, onRate }) {
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState("setup");
  const [auf, setAuf] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session) return;
    setQueue(session.mode === "single" ? [...session.items] : shuffle(session.items));
    setIndex(0);
    setRound(1);
    setPhase("setup");
    setAuf(nextAuf());
    setElapsed(0);
    setCopied(false);
  }, [session]);

  useEffect(() => {
    if (phase !== "question") return undefined;
    const startedAt = performance.now();
    const timer = window.setInterval(() => setElapsed((performance.now() - startedAt) / 1000), 100);
    return () => window.clearInterval(timer);
  }, [phase, index, round]);

  const item = queue[index];
  const algorithms = useMemo(() => item ? trainingAlgorithms(item, auf) : null, [item, auf]);
  const total = queue.length;
  const position = session?.mode === "single" ? `第 ${round} 轮` : `${String(Math.min(index + 1, total)).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  if (!session || !item) return null;

  async function copySetup() {
    await navigator.clipboard.writeText(algorithms.setup);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function startQuestion() {
    setElapsed(0);
    setPhase("question");
  }

  function answer(rating) {
    onRate(item, rating);
    if (session.mode !== "single" && index + 1 >= total) {
      setPhase("complete");
      return;
    }
    if (session.mode !== "single") setIndex((value) => value + 1);
    else setRound((value) => value + 1);
    setAuf((value) => nextAuf(value));
    setElapsed(0);
    setPhase("setup");
  }

  function restart() {
    setQueue(session.mode === "single" ? [...session.items] : shuffle(session.items));
    setIndex(0);
    setRound((value) => session.mode === "single" ? value + 1 : 1);
    setAuf((value) => nextAuf(value));
    setElapsed(0);
    setPhase("setup");
  }

  return (
    <Dialog.Root open={Boolean(session)} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="trainer-overlay" />
        <Dialog.Content className="trainer-dialog">
          <header className="trainer-heading">
            <div><span>CASE DRILL</span><strong>{session.title}</strong></div>
            <div><b>{phase === "complete" ? "COMPLETE" : position}</b><Dialog.Close aria-label="关闭案例训练"><X /></Dialog.Close></div>
          </header>

          {phase === "complete" ? <div className="trainer-complete">
            <i><Check /></i>
            <span>ROUND COMPLETE</span>
            <Dialog.Title>这一轮练完了</Dialog.Title>
            <Dialog.Description>你完成了 {total} 个案例。再来一轮会重新打乱顺序和顶层朝向。</Dialog.Description>
            <div><button type="button" onClick={restart}><RefreshCcw />再来一轮</button><Dialog.Close>结束训练</Dialog.Close></div>
          </div> : <div className="trainer-layout">
            <section className={`trainer-stage trainer-stage-${phase}`} aria-label={phase === "setup" ? "摆型准备" : "待识别案例"}>
              {phase === "setup" ? <div className="setup-illustration">
                <div className="setup-cube-mark"><ScanSearch /></div>
                <span>PHYSICAL CUBE</span>
                <strong>先在手里的魔方上摆题</strong>
                <small>每轮会随机改变顶层朝向，避免只记固定拿法。</small>
              </div> : <>
                <AnimatedCube algorithm={algorithms.solution} label={phase === "answer" ? `${item.name} 训练案例` : "待识别案例"} compact />
                <div className="recognition-clock"><Clock3 /><span>{elapsed.toFixed(1)}s</span><small>{phase === "question" ? "识别中" : "本题用时"}</small></div>
              </>}
            </section>

            <section className="trainer-copy">
              {phase === "setup" && <>
                <span className="trainer-eyebrow">01 · SET UP</span>
                <Dialog.Title>从复原状态摆出题目</Dialog.Title>
                <Dialog.Description>黄面朝上，从任意侧面作为前面，按顺序执行下面的 Setup。</Dialog.Description>
                <div className="trainer-setup-code"><div><span>SETUP FORMULA</span><button type="button" onClick={copySetup}>{copied ? <Check /> : <Copy />}{copied ? "已复制" : "复制"}</button></div><code>{algorithms.setup}</code></div>
                <ol className="trainer-steps"><li><i>1</i><span><strong>确认魔方已经复原</strong><small>底下两层必须是完整状态</small></span></li><li><i>2</i><span><strong>黄面朝上执行 Setup</strong><small>执行完不要转动整颗魔方</small></span></li><li><i>3</i><span><strong>准备好再开始识别</strong><small>下一页会隐藏案例名称和答案</small></span></li></ol>
                <button className="trainer-primary" type="button" onClick={startQuestion}>摆好了，开始识别 <Eye /></button>
              </>}

              {phase === "question" && <>
                <span className="trainer-eyebrow">02 · RECOGNIZE</span>
                <Dialog.Title>这是哪个案例？</Dialog.Title>
                <Dialog.Description>先找黄色轮廓和侧面特征，在脑中说出公式后再显示答案。</Dialog.Description>
                <div className="recognition-prompt"><ScanSearch /><div><strong>案例身份已隐藏</strong><small>{item.stage.toUpperCase()} · 随机顶层朝向</small></div></div>
                <button className="trainer-primary" type="button" onClick={() => setPhase("answer")}>显示答案</button>
              </>}

              {phase === "answer" && <>
                <span className="trainer-eyebrow">03 · CHECK</span>
                <Dialog.Title>{item.name}</Dialog.Title>
                <Dialog.Description>{item.stage.toUpperCase()} {item.id} · {item.alias}</Dialog.Description>
                <div className="trainer-answer-card"><div><span>本轮解法</span>{auf && <b>先做 {auf}</b>}</div><code>{algorithms.solution}</code><p>{item.recognition}</p></div>
                <div className="trainer-rating"><span>刚才认得怎么样？</span><div><button type="button" onClick={() => answer("again")}><strong>忘了</strong><small>继续学习</small></button><button type="button" onClick={() => answer("hard")}><strong>有点犹豫</strong><small>缩短间隔</small></button><button className="is-good" type="button" onClick={() => answer("good")}><strong>很顺手</strong><small>进入复习</small></button></div></div>
              </>}
            </section>
          </div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
