import ErrorPage from '../components/layout/ErrorPage';

export default function ServerError() {
  return (
    <ErrorPage
      code="500"
      title="Something went wrong"
      message="An unexpected error occurred. Please try again."
    />
  );
}
