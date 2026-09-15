export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-8">
      <div
        role="dialog"
        aria-modal="true"
        className="mx-auto w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-field px-2 py-1 text-text-muted hover:bg-border/50"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
