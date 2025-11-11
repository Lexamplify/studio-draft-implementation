"use server";

import { ConvexHttpClient } from "convex/browser";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { adminAuth, adminDb } from "@/lib/firebase-admin-editor";
import { cookies } from "next/headers";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function getDocuments(ids: Id<"documents">[]) {
  return await convex.query(api.documents.getByIds, { ids });
}

export async function getUsers() {
  try {
    // Get current user from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    
    if (!sessionCookie) {
      return [];
    }
    
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const currentUserId = decodedClaims.uid;
    
    // Get all users from Firebase Auth (limited to 1000)
    // In a production app, you might want to filter by organization or use Firestore
    const listUsersResult = await adminAuth.listUsers(1000);
    
    const users = listUsersResult.users.map((user) => {
      const name = user.displayName || user.email || "Anonymous";
      const nameToNumber = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hue = Math.abs(nameToNumber) % 360;
      const color = `hsl(${hue}, 80%, 60%)`;
      
      return {
        id: user.uid,
        name: name,
        avatar: user.photoURL || "",
        color: color,
      };
    });
    
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}
