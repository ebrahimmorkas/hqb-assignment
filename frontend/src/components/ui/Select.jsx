export default function Select({ className = '', hasError = false, children, ...rest }) {
  return (
    <select
      className={`w-full rounded-field border bg-surface px-3 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 ${
        hasError ? 'border-danger' : 'border-border'
      } ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}
