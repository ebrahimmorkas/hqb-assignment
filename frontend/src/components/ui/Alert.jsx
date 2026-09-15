export default function Alert({ children }) {
  if (!children) return null;

  return (
    <div className="rounded-field border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
      {children}
    </div>
  );
}
