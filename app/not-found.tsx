import Link from 'next/link';
import { Train } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="glass-card rounded-3xl p-10 max-w-md space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rail-blue/10 text-rail-blue mx-auto">
          <Train className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground">Page Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-rail-blue px-4 py-2 text-xs font-semibold text-white shadow-glow hover:bg-sky-600 transition-colors"
        >
          Back to Search
        </Link>
      </div>
    </div>
  );
}
