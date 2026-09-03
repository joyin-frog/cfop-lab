export function Button({ variant = "primary", className = "", children, ...props }) {
  return (
    <button className={`button button-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
