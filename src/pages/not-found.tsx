export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-4xl font-black mb-4">404</h1>
        <p className="text-lg text-foreground/70 uppercase tracking-widest font-bold">Page Not Found</p>
      </div>
    </div>
  );
}
