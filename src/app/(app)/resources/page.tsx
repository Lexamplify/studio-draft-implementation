"use client";

import React from "react";
import { BookOpen, Landmark, Gavel, Globe, Users } from "lucide-react";
import { useRouter } from "next/navigation";

const categories = [
  {
    name: "Indian Courts",
    icon: <Landmark className="h-10 w-10 text-blue-500" />,
    href: "/resources/courts",
    color: "from-blue-100 to-blue-50 border-blue-200 hover:shadow-blue-200",
    description: "Supreme Court, High Courts, District Courts, and more."
  },
  {
    name: "Legal Research & Judgements",
    icon: <BookOpen className="h-10 w-10 text-green-500" />,
    href: "/resources/legal-research",
    color: "from-green-100 to-green-50 border-green-200 hover:shadow-green-200",
    description: "Research tools, case law, bare acts, and commissions."
  },
  {
    name: "Bar Councils & Legal Bodies",
    icon: <Users className="h-10 w-10 text-purple-500" />,
    href: "/resources/bar-councils",
    color: "from-purple-100 to-purple-50 border-purple-200 hover:shadow-purple-200",
    description: "Bar Council of India, Ministry of Law, and more."
  },
  {
    name: "Other Useful Resources",
    icon: <Globe className="h-10 w-10 text-orange-500" />,
    href: "/resources/other",
    color: "from-orange-100 to-orange-50 border-orange-200 hover:shadow-orange-200",
    description: "Legal news, services, and additional resources."
  },
];

export default function ResourcesPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-3 text-center text-blue-700 drop-shadow-sm tracking-tight">Legal Resources</h1>
        <p className="mb-12 text-center text-gray-600 text-lg">Curated links to Indian courts, legal research, and law resources. Select a category to explore.</p>
        <div className="grid gap-10 md:grid-cols-2">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => router.push(cat.href)}
              className={`group w-full bg-gradient-to-br ${cat.color} border rounded-2xl shadow-lg p-8 flex flex-col items-center gap-4 transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400`}
              aria-label={`Go to ${cat.name}`}
            >
              <div className="flex items-center justify-center mb-2">
                {cat.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 tracking-tight mb-1">{cat.name}</h2>
              <p className="text-gray-600 text-sm mb-2 text-center">{cat.description}</p>
              <span className="inline-block mt-2 px-4 py-1 rounded-full bg-white/80 text-blue-700 font-semibold text-xs shadow group-hover:bg-blue-50 border border-blue-100 transition">Explore</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 