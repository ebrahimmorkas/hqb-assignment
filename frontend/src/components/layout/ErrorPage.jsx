import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import Button from '../ui/Button';

// Shared shell for the 404/403/500 pages - each just supplies its own code
// and copy.
export default function ErrorPage({ code, title, message }) {
  const navigate = useNavigate();

  return (
    <AuthLayout title={title} subtitle={message}>
      <p className="mb-6 text-center text-5xl font-bold text-primary">{code}</p>
      <Button onClick={() => navigate('/')}>Go home</Button>
    </AuthLayout>
  );
}
