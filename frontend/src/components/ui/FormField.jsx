import Input from './Input';
import PasswordInput from './PasswordInput';
import FieldWrapper from './FieldWrapper';

export default function FormField({ label, error, id, ...inputProps }) {
  const Field = inputProps.type === 'password' ? PasswordInput : Input;

  return (
    <FieldWrapper label={label} id={id} error={error}>
      <Field id={id} hasError={!!error} {...inputProps} />
    </FieldWrapper>
  );
}
