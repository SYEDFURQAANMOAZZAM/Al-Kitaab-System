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
      className={`rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive ${className}`}
    >
      {message}
    </div>
  );
}