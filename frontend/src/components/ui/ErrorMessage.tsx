export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-derrota text-lg">{message}</p>
    </div>
  );
}
