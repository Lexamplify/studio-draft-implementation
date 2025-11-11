"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebaseClient";
import { deleteDocument } from "@/lib/firebase-document-service";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RemoveDialogProps {
  documentId: string; // Changed from Id<"documents"> since Convex types are disabled
  children: React.ReactNode;
}

export const RemoveDialog = ({ documentId, children }: RemoveDialogProps) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [user] = useAuthState(auth);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permamently delete your document.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isRemoving}
              onClick={(e) => {
              e.stopPropagation();
              if (!user?.uid) {
                toast.error("Please sign in to delete documents");
                return;
              }
              setIsRemoving(true);
              deleteDocument(documentId, user.uid)
                .catch(() => toast.error("Something went wrong"))
                .then(() => {
                  toast.success("Document removed");
                })
                .finally(() => setIsRemoving(false));
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
