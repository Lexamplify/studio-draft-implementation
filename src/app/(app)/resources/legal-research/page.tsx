import { BookOpen } from "lucide-react";
import Link from "next/link";

const researchLinks = [
  { name: "SCC Online", url: "https://www.scconline.com/" },
  { name: "Indian Kanoon", url: "https://indiankanoon.org/" },
  { name: "Manupatra", url: "https://www.manupatrafast.com/" },
  { name: "Judis (Supreme Court Judgments)", url: "https://judis.nic.in/" },
  { name: "Bare Acts Live", url: "https://www.bareactslive.com/" },
  { name: "Law Commission of India", url: "https://lawcommissionofindia.nic.in/" },
];

export default function LegalResearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/resources" className="inline-flex items-center gap-2 mb-6 text-green-700 hover:bg-green-100 px-3 py-2 rounded-lg transition font-medium text-sm">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Resources
        </Link>
        <div className="flex flex-col items-center mb-8">
          <BookOpen className="h-14 w-14 text-green-600 mb-2" />
          <h1 className="text-3xl font-extrabold text-green-800 mb-1 tracking-tight">Legal Research & Judgements</h1>
          <p className="text-gray-600 text-center">Curated links for legal research, case law, bare acts, and commissions.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {researchLinks.map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white border border-green-100 rounded-xl shadow hover:shadow-lg hover:bg-green-50 transition p-5 text-center group"
            >
              <span className="text-lg font-semibold text-green-800 group-hover:text-green-900">{link.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
} 