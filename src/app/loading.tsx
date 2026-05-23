export default function LoadingPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  );
}
