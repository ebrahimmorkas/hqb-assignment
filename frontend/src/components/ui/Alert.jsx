const TONES = {
  danger: 'border-danger/30 bg-danger-bg text-danger',
  success: 'border-success/30 bg-success-bg text-success',
};

export default function Alert({ children, tone = 'danger', onClose }) {
  if (!children) return null;

  return (
    <div
      className={`mb-4 flex items-start justify-between gap-3 rounded-field border px-3 py-2 text-sm ${TONES[tone]}`}
    >
      <span>{children}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 text-base leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}
