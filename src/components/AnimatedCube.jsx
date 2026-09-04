import { useEffect, useMemo, useRef, useState } from "react";
import { invertAlgorithm } from "../lib/algorithms";

const MOVE_SETTLE_DELAY = 40;
let twistyModulePromise;

function loadTwistyPlayer() {
  twistyModulePromise ||= import("cubing/twisty");
  return twistyModulePromise;
}

export function AnimatedCube({ algorithm, label, compact = false }) {
  const playerRef = useRef(null);
  const previewTimerRef = useRef(null);
  const previewRunRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeMove, setActiveMove] = useState(-1);
  const moves = useMemo(() => algorithm.trim().split(/\s+/).filter(Boolean), [algorithm]);
  const setupAlgorithm = useMemo(() => `z2 ${invertAlgorithm(algorithm)}`, [algorithm]);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setLoadError(false);
    setActiveMove(-1);
    const readyTimer = window.setTimeout(async () => {
      try {
        await loadTwistyPlayer();
        await window.customElements.whenDefined("twisty-player");
        const player = playerRef.current;
        if (cancelled || !player) return;
        player.jumpToStart({ flash: false });
        setReady(true);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(readyTimer);
      previewRunRef.current += 1;
      window.clearTimeout(previewTimerRef.current);
      playerRef.current?.pause();
    };
  }, [algorithm]);

  async function previewMove(index) {
    const player = playerRef.current;
    if (!player || !ready) return;

    const run = ++previewRunRef.current;
    window.clearTimeout(previewTimerRef.current);
    player.pause();

    const indexer = await player.experimentalModel.indexer.get();
    if (run !== previewRunRef.current || player !== playerRef.current) return;

    const duration = indexer.moveDuration(index);
    const start = indexer.indexToMoveStartTimestamp(index);
    const end = start + duration;

    setActiveMove(index);
    player.timestamp = start;

    previewTimerRef.current = window.setTimeout(() => {
      if (run !== previewRunRef.current || player !== playerRef.current) return;
      player.play();
      previewTimerRef.current = window.setTimeout(() => {
        if (run !== previewRunRef.current || player !== playerRef.current) return;
        player.pause();
        player.timestamp = end;
      }, Math.max(180, duration / 1.15));
    }, MOVE_SETTLE_DELAY);
  }

  function resetPreview() {
    const player = playerRef.current;
    if (!player || !ready) return;

    previewRunRef.current += 1;
    window.clearTimeout(previewTimerRef.current);
    player.pause();
    player.jumpToStart({ flash: false });
    setActiveMove(-1);
  }

  function handlePreviewLeave(event) {
    if (event.pointerType !== "touch") resetPreview();
  }

  function handlePreviewBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) resetPreview();
  }

  return (
    <div className={`${ready ? "animated-cube is-ready" : "animated-cube"} ${compact ? "is-compact" : ""}`}>
      <div className="cube-stage">
        <div className="twisty-mount">
          <twisty-player
            key={algorithm}
            ref={playerRef}
            aria-label={label || "公式动画魔方"}
            puzzle="3x3x3"
            alg={algorithm}
            experimental-setup-alg={setupAlgorithm}
            control-panel="none"
            viewer-link="none"
            background="none"
            back-view="none"
            hint-facelets="floating"
            visualization="3D"
            tempo-scale="1.15"
            camera-latitude="27"
            camera-longitude="32"
            experimental-drag-input="auto"
          />
        </div>
        {!ready && <span className="cube-loading">{loadError ? "3D 魔方加载失败，请刷新重试。" : "正在准备 3D 魔方…"}</span>}
      </div>

      {!compact && <div className="formula-scrubber">
        <div className="scrubber-heading">
          <span>悬停步骤，逐手预览</span>
          <b>{activeMove < 0 ? "READY" : `${String(activeMove + 1).padStart(2, "0")} / ${String(moves.length).padStart(2, "0")}`}</b>
        </div>
        <div
          className="move-tokens"
          aria-label="可交互公式步骤"
          onPointerLeave={handlePreviewLeave}
          onBlur={handlePreviewBlur}
        >
          {moves.map((move, index) => (
            <button
              className={activeMove === index ? "move-token is-active" : "move-token"}
              type="button"
              key={`${move}-${index}`}
              onPointerEnter={() => previewMove(index)}
              onFocus={() => previewMove(index)}
              onClick={() => previewMove(index)}
              disabled={!ready}
              aria-label={`第 ${index + 1} 步 ${move}`}
            >
              {move}
            </button>
          ))}
        </div>
        <small>电脑用鼠标依次划过；手机点按任一步。拖动魔方可换视角。</small>
      </div>}
    </div>
  );
}
