import ErrorPage from '../components/layout/ErrorPage';

export default function NotFound() {
  return <ErrorPage code="404" title="Page not found" message="That page doesn't exist." />;
}
