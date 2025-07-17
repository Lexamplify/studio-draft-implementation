import { Landmark } from "lucide-react";
import Link from "next/link";

const courtLinks = [
  { name: "Supreme Court of India", url: "https://main.sci.gov.in/" },
  { name: "e-Courts (District & Taluka)", url: "https://ecourts.gov.in/" },
  { name: "Delhi High Court", url: "https://delhihighcourt.nic.in/" },
  { name: "Bombay High Court", url: "https://bombayhighcourt.nic.in/" },
  { name: "Calcutta High Court", url: "https://www.calcuttahighcourt.gov.in/" },
  { name: "Allahabad High Court", url: "https://www.allahabadhighcourt.in/" },
  { name: "Karnataka High Court", url: "https://karnatakajudiciary.kar.nic.in/" },
  { name: "Madras High Court", url: "https://www.mhc.tn.gov.in/" },
  { name: "Punjab & Haryana High Court", url: "https://highcourtchd.gov.in/" },
  { name: "More High Courts", url: "https://doj.gov.in/judiciary/high-courts/" },
];

export default function CourtsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/resources" className="inline-flex items-center gap-2 mb-6 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg transition font-medium text-sm">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Resources
        </Link>
        <div className="flex flex-col items-center mb-8">
          <Landmark className="h-14 w-14 text-blue-600 mb-2" />
          <h1 className="text-3xl font-extrabold text-blue-800 mb-1 tracking-tight">Indian Courts</h1>
          <p className="text-gray-600 text-center">Links to Supreme Court, High Courts, and District Courts in India.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {courtLinks.map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white border border-blue-100 rounded-xl shadow hover:shadow-lg hover:bg-blue-50 transition p-5 text-center group"
            >
              <span className="text-lg font-semibold text-blue-800 group-hover:text-blue-900">{link.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
} 