import Select from './Select';
import FieldWrapper from './FieldWrapper';

export default function SelectField({ label, error, id, options, ...selectProps }) {
  return (
    <FieldWrapper label={label} id={id} error={error}>
      <Select id={id} hasError={!!error} {...selectProps}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </FieldWrapper>
  );
}
