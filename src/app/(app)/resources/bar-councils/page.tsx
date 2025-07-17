import { Users } from "lucide-react";
import Link from "next/link";

const barCouncilLinks = [
  { name: "Bar Council of India", url: "http://www.barcouncilofindia.org/" },
  { name: "National Judicial Data Grid", url: "https://njdg.ecourts.gov.in/" },
  { name: "Ministry of Law & Justice", url: "https://lawmin.gov.in/" },
  { name: "Department of Justice", url: "https://doj.gov.in/" },
];

export default function BarCouncilsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/resources" className="inline-flex items-center gap-2 mb-6 text-purple-700 hover:bg-purple-100 px-3 py-2 rounded-lg transition font-medium text-sm">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Resources
        </Link>
        <div className="flex flex-col items-center mb-8">
          <Users className="h-14 w-14 text-purple-600 mb-2" />
          <h1 className="text-3xl font-extrabold text-purple-800 mb-1 tracking-tight">Bar Councils & Legal Bodies</h1>
          <p className="text-gray-600 text-center">Key legal bodies and councils in India.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {barCouncilLinks.map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white border border-purple-100 rounded-xl shadow hover:shadow-lg hover:bg-purple-50 transition p-5 text-center group"
            >
              <span className="text-lg font-semibold text-purple-800 group-hover:text-purple-900">{link.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
} 