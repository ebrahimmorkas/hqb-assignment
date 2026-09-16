const VARIANTS = {
  primary:
    'bg-primary text-primary-fg hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed',
  ghost: 'bg-transparent text-text hover:bg-border/50',
  danger:
    'bg-danger text-primary-fg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed',
};

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  loading = false,
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`w-full rounded-field px-4 py-2.5 font-medium transition-colors ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading ? 'Please wait...' : children}
    </button>
  );
}
