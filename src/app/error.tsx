"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-bold">Algo salió mal 😵</h1>
      <p className="text-muted-foreground">
        Tuvimos un problema. Intenta de nuevo o vuelve más tarde.
      </p>
      <Button onClick={reset} variant="default">
        Intentar de nuevo
      </Button>
    </div>
  );
}
