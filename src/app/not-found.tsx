import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-6xl font-bold tracking-tighter">404</h1>
      <p className="text-lg text-muted-foreground">
        ¡Oops! Esta botella no está en nuestro catálogo. 🥴
      </p>
      <Link href="/">
        <Button variant="default">Volver al inicio</Button>
      </Link>
    </div>
  );
}
