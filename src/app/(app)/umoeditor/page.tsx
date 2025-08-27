"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';

// Dynamically import the Umo Editor wrapper to avoid SSR issues
const UmoEditor = dynamic(() => import('@/components/UmoEditorWrapper'), {
  ssr: false,
  loading: () => <Skeleton className="h-screen w-full" />,
});

export default function UmoEditorPage() {
  const [isClient, setIsClient] = useState(false);

  // This effect will run only on the client, after the initial render
  useEffect(() => {
    setIsClient(true);
  }, []);

  // On the server, or before the client has mounted, show a loading state.
  if (!isClient) {
    return <Skeleton className="h-screen w-full" />;
  }

  return (
    <div className="">
          <UmoEditor />
    </div>
  );
}