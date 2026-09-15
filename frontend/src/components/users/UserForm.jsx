import { useState } from 'react';
import FormField from '../ui/FormField';
import SelectField from '../ui/SelectField';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { ROLES } from '../../constants/roles';

const ITS_REGEX = /^\d{8}$/;
const PHONE_REGEX = /^\d{7,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_OPTIONS = [
  { value: ROLES.USER, label: 'User' },
  { value: ROLES.ADMIN, label: 'Admin' },
];

// Per-field render + validation. Which fields actually appear is entirely
// up to the `fields` prop the caller passes - nothing here is specific to
// "admin editing" vs "self editing" vs "super-admin creating"; the caller
// decides that by which keys it lists.
const FIELD_DEFS = {
  name: {
    label: 'Name',
    render: (props) => <FormField {...props} />,
    validate: (v) => (!v ? 'Name is required' : null),
  },
  email: {
    label: 'Email',
    render: (props) => <FormField {...props} type="email" />,
    validate: (v) => (!EMAIL_REGEX.test(v || '') ? 'Enter a valid email' : null),
  },
  phone: {
    label: 'Phone',
    render: (props) => <FormField {...props} placeholder="Optional" />,
    validate: (v) => (v && !PHONE_REGEX.test(v) ? 'Phone must be 7-15 digits' : null),
  },
  age: {
    label: 'Age',
    render: (props) => <FormField {...props} type="number" min={0} max={120} />,
    validate: (v) =>
      v === '' || v === undefined || Number.isNaN(Number(v)) || Number(v) < 0 || Number(v) > 120
        ? 'Enter a valid age (0-120)'
        : null,
  },
  its: {
    label: 'ITS',
    render: (props) => (
      <FormField
        {...props}
        inputMode="numeric"
        onChange={(e) => props.onChange({ target: { value: e.target.value.replace(/\D/g, '').slice(0, 8) } })}
      />
    ),
    validate: (v) => (!ITS_REGEX.test(v || '') ? 'ITS must be exactly 8 digits' : null),
  },
  watan: {
    label: 'Watan',
    render: (props, { watanOptions = [] }) => (
      <SelectField
        {...props}
        options={[{ value: '', label: 'Select a watan' }, ...watanOptions.map((w) => ({ value: w.name, label: w.name }))]}
      />
    ),
    validate: (v) => (!v ? 'Watan is required' : null),
  },
  role: {
    label: 'Role',
    // No blank placeholder option here (unlike watan) - the browser shows
    // the first real option ("User") by default regardless of React's
    // state, so the initial state below must actually match that or
    // validation fails on a value the UI never let the user leave.
    defaultValue: ROLES.USER,
    render: (props) => <SelectField {...props} options={ROLE_OPTIONS} />,
    validate: (v) => (!v ? 'Role is required' : null),
  },
  password: {
    label: 'Password',
    render: (props) => <FormField {...props} type="password" autoComplete="new-password" />,
    validate: (v) => (!v || v.length < 6 ? 'Password must be at least 6 characters' : null),
  },
};

export default function UserForm({
  fields,
  initialValues = {},
  watanOptions = [],
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      fields.map((key) => [key, initialValues[key] ?? FIELD_DEFS[key].defaultValue ?? ''])
    )
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setValue = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const nextErrors = {};
    for (const key of fields) {
      const err = FIELD_DEFS[key].validate(values[key]);
      if (err) nextErrors[key] = err;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = { ...values };
      if ('age' in payload) payload.age = Number(payload.age);
      // Phone is the one optional field - the backend treats "not provided"
      // (key absent) as no phone, but an empty string is a value it tries
      // to validate as a phone number and fails. Omit it rather than send ''.
      if ('phone' in payload && payload.phone === '') delete payload.phone;
      await onSubmit(payload);
    } catch (err) {
      setFormError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Alert>{formError}</Alert>

      {fields.map((key) => {
        const def = FIELD_DEFS[key];
        return (
          <div key={key}>
            {def.render(
              {
                id: key,
                label: def.label,
                value: values[key],
                error: errors[key],
                onChange: (e) => setValue(key, e.target.value),
              },
              { watanOptions }
            )}
          </div>
        );
      })}

      <div className="mt-2 flex gap-3">
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
