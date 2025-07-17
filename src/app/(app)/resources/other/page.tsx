import { Globe } from "lucide-react";
import Link from "next/link";

const otherLinks = [
  { name: "Live Law", url: "https://www.livelaw.in/" },
  { name: "Bar & Bench", url: "https://www.barandbench.com/" },
  { name: "Legal Service India", url: "https://www.legalserviceindia.com/" },
  { name: "Vakilno1", url: "https://www.vakilno1.com/" },
];

export default function OtherResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/resources" className="inline-flex items-center gap-2 mb-6 text-orange-700 hover:bg-orange-100 px-3 py-2 rounded-lg transition font-medium text-sm">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Resources
        </Link>
        <div className="flex flex-col items-center mb-8">
          <Globe className="h-14 w-14 text-orange-600 mb-2" />
          <h1 className="text-3xl font-extrabold text-orange-800 mb-1 tracking-tight">Other Useful Resources</h1>
          <p className="text-gray-600 text-center">Legal news, services, and additional resources for the legal community.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {otherLinks.map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white border border-orange-100 rounded-xl shadow hover:shadow-lg hover:bg-orange-50 transition p-5 text-center group"
            >
              <span className="text-lg font-semibold text-orange-800 group-hover:text-orange-900">{link.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
} 