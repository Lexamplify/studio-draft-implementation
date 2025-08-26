"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import dynamic from 'next/dynamic';

// Dynamically import the Umo Editor wrapper to avoid SSR issues
const UmoEditor = dynamic(() => import('@/components/UmoEditorWrapper'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export default function UmoEditorPage() {
  const [isClient, setIsClient] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // This effect will run only on the client, after the initial render
  useEffect(() => {
    setIsClient(true);
  }, []);

  // On the server, or before the client has mounted, show a loading state.
  if (!isClient) {
    return <Skeleton className="h-screen w-full" />;
  }

  // Once on the client, you can conditionally render the editor
  if (showEditor) {
    return (
      <div className="flex flex-col h-screen p-4">
        <CardHeader className="p-2 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-semibold">Umo Editor</CardTitle>
            <Button variant="outline" onClick={() => setShowEditor(false)} size="sm">
              <Icons.Close className="mr-2 h-4 w-4" /> Close Editor
            </Button>
          </div>
        </CardHeader>
        <div className="flex-1 overflow-hidden pt-4">
          <div className="w-full h-full border rounded-lg">
            <UmoEditor />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <Button onClick={() => setShowEditor(true)}>
        Open Umo Editor
      </Button>
    </div>
  );
}