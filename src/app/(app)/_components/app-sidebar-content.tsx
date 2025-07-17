"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { updateProfile, signOut } from "firebase/auth";
import { useState } from "react";
import { auth } from '@/lib/firebaseClient';

export default function AppSidebarContent() {
  const pathname = usePathname();
  const { state } = useSidebar();

  if (state === "collapsed") {
    // Only show the trigger button when collapsed
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <SidebarTrigger />
      </div>
    );
  }

  const navItems = [
    { href: "/assistant", label: "Assistant", icon: Icons.Assistant },
    { href: "/draft", label: "Draft", icon: Icons.Draft },
    { href: "/vault", label: "Vault", icon: Icons.Vault },
    { href: "/calendar", label: "Calendar", icon: Icons.Calendar },
    { href: "/resources", label: "Resources", icon: Icons.BookOpen },
  ];

  return (
    <>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <Link href="/assistant" className="flex items-center gap-2">
            <Icons.Logo />
          </Link>
          <div className="hidden md:flex">
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/assistant" && pathname?.startsWith(item.href))}
                tooltip={{ children: item.label, className: "bg-card text-card-foreground border" }}
                className="group/button"
              >
                <Link href={item.href}>
                  <item.icon />
                  <span className="hidden group-data-[state=expanded]:inline">
                    {item.label}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <ProfileSidebarButton />
        <SignOutSidebarButton />
      </SidebarFooter>
    </>
  );
}

function ProfileSidebarButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2 group/button group-data-[state=expanded]:group-hover/button:justify-start group-data-[state=collapsed]:group-hover/button:justify-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-2"
      aria-label="Profile"
      onClick={() => router.push("/profile")}
    >
      <Icons.User className="h-4 w-4" />
      <span className="hidden group-data-[state=expanded]:inline">Profile</span>
    </Button>
  );
}

function SignOutSidebarButton() {
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/login");
  };
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2 mt-2 group/button group-data-[state=expanded]:group-hover/button:justify-start group-data-[state=collapsed]:group-hover/button:justify-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-2"
      aria-label="Sign Out"
      onClick={handleSignOut}
    >
      <Icons.Logout className="h-4 w-4" />
      <span className="hidden group-data-[state=expanded]:inline">Sign Out</span>
    </Button>
  );
}
