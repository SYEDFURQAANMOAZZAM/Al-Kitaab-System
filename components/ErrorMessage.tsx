type ErrorMessageProps = {
  message?: string;
  className?: string;
};

export default function ErrorMessage({
  message,
  className = "",
}: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 ${className}`}
    >
      {message}
    </div>
  );
}