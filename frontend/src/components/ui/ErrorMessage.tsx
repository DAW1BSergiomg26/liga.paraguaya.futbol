export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-red-400 text-lg">{message}</p>
    </div>
  );
}
