export default function Input({ className = '', hasError = false, ...rest }) {
  return (
    <input
      className={`w-full rounded-field border bg-surface px-3 py-2.5 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 ${
        hasError ? 'border-danger' : 'border-border'
      } ${className}`}
      {...rest}
    />
  );
}
