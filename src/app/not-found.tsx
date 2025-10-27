import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Not Found</h2>
        <p className="text-gray-600 mb-6">
          Could not find the requested resource.
        </p>
        <Link href="/">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

