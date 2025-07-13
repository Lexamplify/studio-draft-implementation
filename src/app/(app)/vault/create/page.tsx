"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../../lib/firebaseClient";
import { getAuth } from "firebase/auth";

const CreateCasePage: React.FC = () => {
  const router = useRouter();
  const auth = getAuth();

  // Form state
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [caseSummary, setCaseSummary] = useState<string>("");

  // Metadata fields
  const [petitionerName, setPetitionerName] = useState<string>("");
  const [respondentName, setRespondentName] = useState<string>("");
  const [filingDate, setFilingDate] = useState<string>(""); // yyyy-MM-dd
  const [judgeName, setJudgeName] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation: name is required
    if (!name.trim()) {
      setError("Case Name is required.");
      return;
    }

    setSubmitting(true);

    try {
      // Get current user UID
      const user = auth.currentUser;
      if (!user) {
        setError("You must be logged in to create a case.");
        setSubmitting(false);
        return;
      }
      const uid = user.uid;

      // Prepare metadata object
      const metadata: {
        petitionerName?: string;
        respondentName?: string;
        filingDate?: Timestamp;
        judgeName?: string;
      } = {};

      if (petitionerName.trim()) {
        metadata.petitionerName = petitionerName.trim();
      }
      if (respondentName.trim()) {
        metadata.respondentName = respondentName.trim();
      }
      if (filingDate) {
        // Convert yyyy-MM-dd into a Firestore Timestamp
        const [year, month, day] = filingDate.split("-").map(Number);
        const jsDate = new Date(year, month - 1, day);
        metadata.filingDate = Timestamp.fromDate(jsDate);
      }
      if (judgeName.trim()) {
        metadata.judgeName = judgeName.trim();
      }

      // Write a new document under /users/{uid}/cases
      const userCasesCollection = collection(db, "users", uid, "cases");
      const docRef = await addDoc(userCasesCollection, {
        name: name.trim(),
        description: description.trim(),
        caseSummary: caseSummary.trim(),
        metadata,
        createdAt: Timestamp.now(),
      });

      // Navigate to the newly created case page (same UI we built for file listing)
      router.push(`/vault/${docRef.id}`);
    } catch (err) {
      console.error("Error creating new case:", err);
      setError("Failed to create case. Please try again.");
      setSubmitting(false);
      return;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Create New Case</h1>

      {error && (
        <p className="text-red-500 mb-4">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Case Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Case Name<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. ABC Corp. v. XYZ Ltd."
            className="block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the case…"
            className="block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* Case Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Case Summary
          </label>
          <textarea
            value={caseSummary}
            onChange={(e) => setCaseSummary(e.target.value)}
            placeholder="Detailed summary of the case facts…"
            className="block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>

        {/* ---------- Metadata Fields ---------- */}
        <h2 className="text-lg font-medium text-gray-800 mt-8 mb-4">
          Metadata (Optional)
        </h2>

        {/* Petitioner Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Petitioner Name
          </label>
          <input
            type="text"
            value={petitionerName}
            onChange={(e) => setPetitionerName(e.target.value)}
            placeholder="e.g. ABC Corporation"
            className="block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Respondent Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Respondent Name
          </label>
          <input
            type="text"
            value={respondentName}
            onChange={(e) => setRespondentName(e.target.value)}
            placeholder="e.g. XYZ Limited"
            className="block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filing Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filing Date
          </label>
          <input
            type="date"
            value={filingDate}
            onChange={(e) => setFilingDate(e.target.value)}
            className="block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
        </div>

        {/* Judge Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Judge Name
          </label>
          <input
            type="text"
            value={judgeName}
            onChange={(e) => setJudgeName(e.target.value)}
            placeholder="e.g. Hon. Justice [Name]"
            className="block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={submitting}
            className={`w-full inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              submitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {submitting ? "Creating…" : "Create Case"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCasePage;
