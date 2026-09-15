// Shared label + error chrome for FormField (text input) and SelectField
// (dropdown) - keeps both consistent without duplicating this markup.
export default function FieldWrapper({ label, id, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}
