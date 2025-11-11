"use client";
import Link from "next/link";
import Image from "next/image";
import { SearchInput } from "./search-input";
import { Button } from "@/components/ui/button";
import { EditIcon, LogOut } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebaseClient";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";


export const Navbar = () => {
  const [user] = useAuthState(auth);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="flex items-center justify-between h-full w-full">
      <div className="flex gap-3 items-center shrink-0 pr-6">
        <Link href="/">
          <Image src={"/logo.svg"} alt="Logo" width={36} height={36} />
        </Link>
        <h3 className="text-xl">Docs</h3>
      </div>
      <SearchInput />
      <div className="flex gap-3 items-center pl-6">
        <Link href="/template-editor">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <EditIcon className="size-4" />
            Template Editor
          </Button>
        </Link>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer size-10">
                <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                <AvatarFallback>
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem disabled>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.displayName || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 size-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
};
