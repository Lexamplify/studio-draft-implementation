// src/app/(app)/vault/page.tsx

'use client'; // <-- This page uses client‐side React hooks & Firestore SDK

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectCard from "./_components/project-card";

import { db } from "@/lib/firebaseClient";
import {
  collection,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData
} from "firebase/firestore";
import { useFirebaseUser } from "@/hooks/use-firebase-user";

// ── 1) Define a "Project" shape for ProjectCard.
interface Project {
  id: string;
  title: string;
  subtitle: string;
  iconType: "folder";
  fileCount: number;
  queryCount: number;
  accessType: "shared" | "private";
  dataAiHint: string;
  petitionerName?: string;
  respondentName?: string;
  judgeName?: string;
  filingDate?: string;
  lastModified?: string;
}

export default function VaultPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseUser();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    async function fetchCases() {
      try {
        if (!user) return;
        const uid = user.uid;
        const casesColRef = collection(db, "users", uid, "cases");
        const snapshot = await getDocs(casesColRef);
        const projectsWithFiles: Project[] = await Promise.all(snapshot.docs.map(async (doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          const name = data.name || "Untitled Case";
          const description = data.description || "No description available";
          const metadata = data.metadata || {};
          let fileCount = 0;
          let lastModified: string | undefined = undefined;
          try {
            const filesColRef = collection(db, "users", uid, "cases", doc.id, "files");
            const filesSnap = await getDocs(filesColRef);
            fileCount = filesSnap.size;
            let latest = 0;
            filesSnap.forEach(f => {
              const uploadedAt = f.data().uploadedAt;
              if (uploadedAt && uploadedAt.seconds) {
                latest = Math.max(latest, uploadedAt.seconds * 1000);
              }
            });
            if (latest > 0) lastModified = new Date(latest).toLocaleDateString();
          } catch {}
          return {
            id: doc.id,
            title: name,
            subtitle: description,
            iconType: 'folder',
            fileCount,
            queryCount: 0,
            accessType: 'shared',
            dataAiHint: (data.caseSummary || '').substring(0, 50),
            petitionerName: metadata.petitionerName,
            respondentName: metadata.respondentName,
            judgeName: metadata.judgeName,
            filingDate: metadata.filingDate ? (metadata.filingDate.toDate ? metadata.filingDate.toDate().toLocaleDateString() : metadata.filingDate) : undefined,
            lastModified,
          } satisfies Project;
        }));
        setProjects(projectsWithFiles);
      } catch (err) {
        console.error("Failed to load cases:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, [authLoading, user]);

  // ── 4) Handlers for buttons:
  function handleCreateProject() {
    router.push("/vault/create");
  }

  function handleProjectClick(projectId: string) {
    router.push(`/vault/${projectId}`);
  }

  // ── 5) Render
  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><span className="text-muted-foreground">Loading…</span></div>;
  }

  return (
    <div className="flex flex-col min-h-[100vh] bg-[#f7f8fa] p-4 sm:p-8">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-1">Vault</h1>
        <p className="text-lg text-gray-500">Store and manage your cases.</p>
      </header>
      {/* Create Case Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-12">
        <ProjectCard
          project={{
            id: "__CREATE_BUTTON__",
            title: "Create case",
            subtitle: "Start a new case record",
            iconType: "folder",
            fileCount: 0,
            queryCount: 0,
            accessType: "shared",
            dataAiHint: "",
          }}
          onClick={handleCreateProject}
          isCreateCard
        />
      </div>
      {/* Your Cases Grid */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-800 mb-6">Your Cases</h2>
        {loading ? (
          <p className="text-gray-400">Loading cases…</p>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {projects.map((proj) => (
              <ProjectCard
                key={proj.id}
                project={proj}
                onClick={() => handleProjectClick(proj.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl bg-white/80 border border-dashed border-gray-300 shadow-sm">
            <div className="mb-4 text-gray-300">
              <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-2">No cases found.</p>
            <button
              onClick={handleCreateProject}
              className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-semibold"
            >
              + Create your first case
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
