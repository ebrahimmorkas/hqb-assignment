// Persistent collapsible rail, not an overlay drawer - open shows icon +
// label per item at full width; closed collapses to an icon-only strip
// rather than disappearing. `items` is caller-supplied ({ key, label, icon,
// onClick }), same "configurable, not hardcoded" pattern as
// DataTable/UserForm - this component only owns the collapse mechanics and
// the dark admin-panel look.
export default function Sidebar({ open, items }) {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden bg-sidebar-bg transition-all duration-200 ${
        open ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex h-14 shrink-0 items-center justify-center border-b border-white/10">
        {open ? (
          <span className="text-sm font-semibold uppercase tracking-wide text-sidebar-text-muted">
            Menu
          </span>
        ) : (
          <span className="text-lg font-bold text-sidebar-text">H</span>
        )}
      </div>

      <nav className="flex flex-col gap-1 p-2">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            title={item.label}
            className={`flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-medium whitespace-nowrap text-sidebar-text hover:bg-sidebar-hover ${
              open ? 'text-left' : 'justify-center'
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            {open && item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
