export function CaseDiagram({ stage, caseId, label, detail = false }) {
  return (
    <img
      className={`case-diagram ${detail ? "case-diagram-detail" : ""}`}
      src={`/diagrams/${stage}-${String(caseId).toLowerCase()}.svg`}
      alt={label || `${stage.toUpperCase()} ${caseId} 状态图`}
      width="288"
      height="288"
      draggable="false"
    />
  );
}
