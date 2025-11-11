"use client";

import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebaseClient";
import { updateDocument } from "@/lib/firebase-document-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface RenameDialogProps {
  documentId: string; // Changed from Id<"documents"> since Convex types are disabled
  initialTitle: string;
  children: React.ReactNode;
}

export const RenameDialog = ({ documentId, initialTitle, children }: RenameDialogProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [user] = useAuthState(auth);

  const [title, setTitle] = useState(initialTitle);
  const [open, setOpen] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.uid) {
      toast.error("Please sign in to rename documents");
      return;
    }
    setIsUpdating(true);

    updateDocument(documentId, user.uid, { title: title.trim() || "Untitled" })
      .catch(() => toast.error("Something went wrong"))
      .then(() => toast.success("Document renamed"))
      .finally(() => {
        setIsUpdating(false);
        setOpen(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Rename document</DialogTitle>
            <DialogDescription>Enter a new name for this document</DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document name"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={isUpdating}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating} onClick={(e) => e.stopPropagation()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
