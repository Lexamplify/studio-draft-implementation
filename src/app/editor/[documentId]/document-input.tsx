"use client";

import { useRef, useState } from "react";
import { BsCloudCheck, BsCloudSlash } from "react-icons/bs";
import { useStatus } from "@liveblocks/react";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebaseClient";
import { updateDocument } from "@/lib/firebase-document-service";
import { toast } from "sonner";
import { LoaderIcon } from "lucide-react";

interface DocumentInputProps {
  title: string;
  id: string; // Changed from Id<"documents"> since Convex types are disabled
}

export const DocumentInput = ({ title, id }: DocumentInputProps) => {
  const status = useStatus();
  const [user] = useAuthState(auth);

  const [value, setValue] = useState(title);
  const [isPending, setIsPending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedUpdate = useDebounce((newValue: string) => {
    if (newValue === title || !user?.uid) return;

    setIsPending(true);
    updateDocument(id, user.uid, { title: newValue })
      .then(() => toast.success("Document updated"))
      .catch(() => toast.error("Something went wrong"))
      .finally(() => setIsPending(false));
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.uid) {
      toast.error("Please sign in to update documents");
      return;
    }

    setIsPending(true);
    updateDocument(id, user.uid, { title: value })
      .then(() => {
        toast.success("Document updated");
        setIsEditing(false);
      })
      .catch(() => toast.error("Something went wrong"))
      .finally(() => setIsPending(false));
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedUpdate(newValue);
  };

  const showLoader = isPending || status === "connecting" || status === "reconnecting";
  const showError = status === "disconnected";

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="relative w-fit max-w-[50ch]">
          <span className="invisible whitespace-pre px-1.5 text-lg">{value || " "}</span>
          <input
            ref={inputRef}
            value={value}
            onChange={onChange}
            onBlur={() => setIsEditing(false)}
            className="absolute inset-0 text-lg text-black px-1.5 bg-transparent truncate"
          />
        </form>
      ) : (
        <span
          onClick={() => {
            setIsEditing(true);
            setTimeout(() => {
              inputRef.current?.focus();
            }, 0);
          }}
          className="text-lg px-1.5 cursor-pointer truncate"
        >
          {title}
        </span>
      )}
      {showError && <BsCloudSlash className="size-4" />}
      {!showError && !showLoader && <BsCloudCheck className="size-4" />}
      {showLoader && <LoaderIcon className="size-4 animate-spin text-muted-foreground" />}
    </div>
  );
};
