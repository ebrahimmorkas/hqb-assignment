import ErrorPage from '../components/layout/ErrorPage';

export default function Forbidden() {
  return (
    <ErrorPage code="403" title="Forbidden" message="You don't have permission to do that." />
  );
}
