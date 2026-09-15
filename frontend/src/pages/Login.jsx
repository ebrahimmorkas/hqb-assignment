import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/layout/AuthLayout';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const ITS_REGEX = /^\d{8}$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [its, setIts] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errors = {};
    if (!ITS_REGEX.test(its)) errors.its = 'ITS must be exactly 8 digits';
    if (!password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      await login(its, password);
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Enter your ITS and password to continue">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Alert>{formError}</Alert>

        <FormField
          id="its"
          label="ITS"
          inputMode="numeric"
          autoComplete="username"
          placeholder="12345678"
          value={its}
          error={fieldErrors.its}
          onChange={(e) => setIts(e.target.value.replace(/\D/g, '').slice(0, 8))}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          error={fieldErrors.password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" loading={submitting}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
