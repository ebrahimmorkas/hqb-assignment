import Input from './Input';

export default function FormField({ label, error, id, ...inputProps }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      <Input id={id} hasError={!!error} {...inputProps} />
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}
