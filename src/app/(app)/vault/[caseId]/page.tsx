"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

type CaseMetadata = {
  [key: string]: string | number | boolean | Date | null | undefined;
};
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc as firestoreDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../../../../lib/firebaseClient";
import FileList, { File } from "../_components/file-list";
import { useFirebaseUser } from "@/hooks/use-firebase-user";

const VaultCasePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const caseId = params?.caseId as string | undefined;
  const { user, loading: authLoading } = useFirebaseUser();

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  type Metadata = CaseMetadata;

  const [caseMetadata, setCaseMetadata] = useState<CaseMetadata | null>(null);
  const [metaLoading, setMetaLoading] = useState<boolean>(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);

  // Hidden <input type="file" /> ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exhaustive metadata field list
  const METADATA_FIELDS = [
    { key: 'petitionerName', label: 'Petitioner Name', type: 'text' },
    { key: 'respondentName', label: 'Respondent Name', type: 'text' },
    { key: 'filingDate', label: 'Filing Date', type: 'date' },
    { key: 'judgeName', label: 'Judge Name', type: 'text' },
    { key: 'caseNumber', label: 'Case Number', type: 'text' },
    { key: 'courtName', label: 'Court Name', type: 'text' },
    { key: 'jurisdiction', label: 'Jurisdiction', type: 'text' },
    { key: 'caseType', label: 'Case Type', type: 'text' },
    { key: 'caseStatus', label: 'Case Status', type: 'text' },
    { key: 'hearingDate', label: 'Hearing Date', type: 'date' },
    { key: 'orderDate', label: 'Order/Decision Date', type: 'date' },
    { key: 'valueInDispute', label: 'Value in Dispute', type: 'text' },
    { key: 'arbitrationInstitution', label: 'Arbitration Institution', type: 'text' },
    { key: 'procedureType', label: 'Procedure Type', type: 'text' },
    { key: 'advocates', label: 'Advocate(s)', type: 'text' },
    { key: 'opposingCounsel', label: 'Opposing Counsel', type: 'text' },
    { key: 'bench', label: 'Bench', type: 'text' },
    { key: 'sectionsInvolved', label: 'Section(s) Involved', type: 'text' },
    { key: 'actsStatutes', label: 'Acts/Statutes', type: 'text' },
    { key: 'caseSummary', label: 'Case Summary', type: 'textarea' },
    { key: 'notes', label: 'Notes/Remarks', type: 'textarea' },
  ];

  const [editMetadata, setEditMetadata] = useState<CaseMetadata>({}); // Changed type to CaseMetadata
  const [addFieldKey, setAddFieldKey] = useState<string>(""); // Changed type to string
  const [customField, setCustomField] = useState<string>(""); // Changed type to string
  const [saving, setSaving] = useState<boolean>(false);

  // When entering edit mode, copy metadata
  useEffect(() => {
    if (editMode && caseMetadata) {
      setEditMetadata({ ...caseMetadata });
    }
  }, [editMode, caseMetadata]);

  // Handle field change
  const handleMetaChange = (key: string, value: string | number | boolean | Date | null | undefined) => {
    setEditMetadata((prev) => ({ ...prev, [key]: value }));
  };

  // Handle add field
  const handleAddField = () => {
    let key = addFieldKey;
    if (addFieldKey === 'custom' && customField.trim()) {
      key = customField.trim().replace(/\s+/g, '_');
    }
    if (key && !editMetadata[key]) {
      setEditMetadata((prev: CaseMetadata) => ({ ...prev, [key]: '' }));
    }
    setAddFieldKey("");
    setCustomField("");
  };

  // Handle save
  const handleSaveMetadata = async () => {
    if (!caseId || !user) return;
    setSaving(true);
    try {
      const uid = user.uid;
      const caseDocRef = firestoreDoc(db, "users", uid, "cases", caseId);
      await updateDoc(caseDocRef, { metadata: editMetadata });
      setCaseMetadata(editMetadata);
      setEditMode(false);
      alert("Metadata updated successfully!");
    } catch (err) {
      alert("Failed to update metadata.");
    } finally {
      setSaving(false);
    }
  };

  const fetchFiles = useCallback(async () => {
    if (!caseId || authLoading || !user) return;
    setLoading(true);
    setError(null);
    try {
      const uid = user.uid;
      const filesCollection = collection(db, "users", uid, "cases", caseId, "files");
      const snapshot = await getDocs(filesCollection);
      const filesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as File[];
      setFiles(filesList);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Failed to load files. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [caseId, authLoading, user]);

  useEffect(() => {
    if (!authLoading && user) fetchFiles();
  }, [caseId, fetchFiles, authLoading, user]);

  // Fetch case metadata
  useEffect(() => {
    if (!caseId || authLoading || !user) return;
    const fetchCaseMetadata = async () => {
      setMetaLoading(true);
      setMetaError(null);
      try {
        const uid = user.uid;
        const caseDocRef = firestoreDoc(db, "users", uid, "cases", caseId);
        const caseSnap = await getDoc(caseDocRef);
        if (caseSnap.exists()) {
          const metadata = caseSnap.data().metadata || {};
          
          // bug fixed where filingDate was not being displayed in correct format and now it's updated before loading it to CaseMetadata.
          if (metadata.filingDate) {
            const date = typeof metadata.filingDate.toDate === 'function' 
              ? metadata.filingDate.toDate() 
              : new Date(metadata.filingDate);
            metadata.filingDate = date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }
          
          setCaseMetadata(metadata);
        } else {
          setCaseMetadata(null);
        }
      } catch (err) {
        setMetaError("Failed to load case metadata.");
        setCaseMetadata(null);
      } finally {
        setMetaLoading(false);
      }
    };
    fetchCaseMetadata();
  }, [caseId, authLoading, user]);

  /** 2) FILTER CLIENT‐SIDE BY `searchQuery` **/
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /** 3) TRIGGER HIDDEN FILE INPUT **/
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /** 4) HANDLE FILE SELECT & UPLOAD **/
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !caseId || !user) return;
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uid = user.uid;
      // 4a) UPLOAD BINARY TO STORAGE
      const timestamp = Date.now();
      const newStoragePath = `users/${uid}/cases/${caseId}/files/${timestamp}_${file.name}`;
      const sRef = storageRef(storage, newStoragePath);
      const uploadSnapshot = await uploadBytes(sRef, file);
      const downloadURL = await getDownloadURL(uploadSnapshot.ref);
      // 4b) WRITE FIRESTORE DOCUMENT
      const filesCollection = collection(db, "users", uid, "cases", caseId, "files");
      await addDoc(filesCollection, {
        name: file.name,
        type: file.type || file.name.split(".").pop() || "unknown",
        url: downloadURL,
        uploadedAt: serverTimestamp(),
        storagePath: newStoragePath, // Store this for later deletion
      });
    } catch (firestoreErr) {
      console.error("Firestore addDoc failed:", firestoreErr);
      setError("Failed to save file metadata.");
      setUploading(false);
      return;
    }
    // 4c) RELOAD LIST
    await fetchFiles();
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /** 5) TOGGLE A SINGLE ROW'S CHECKBOX **/
  const onToggleOne = (fileId: string) => {
    setSelectedIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  /** 6) TOGGLE HEADER CHECKBOX **/
  const onToggleAll = () => {
    if (selectedIds.length === filteredFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFiles.map((f) => f.id));
    }
  };

  /** 7) DELETE SELECTED FILES: STORAGE FIRST, THEN FIRESTORE **/
  const handleDeleteSelected = async () => {
    if (!caseId || !selectedIds.length || !user) return;
    setLoading(true);
    setError(null);
    try {
      const uid = user.uid;
      for (const fileId of selectedIds) {
        const fileToDelete = files.find((f) => f.id === fileId);
        if (fileToDelete) {
          const { storagePath: sp } = fileToDelete;
          if (sp) {
            try {
              const objRef = storageRef(storage, sp);
              await deleteObject(objRef);
            } catch (storageDelErr) {
              console.error(
                `Failed to delete storage object ${fileToDelete.name} at ${sp}:`,
                storageDelErr
              );
            }
          }
        }
        const docRef = firestoreDoc(db, "users", uid, "cases", caseId, "files", fileId);
        await deleteDoc(docRef);
      }
    } catch (delErr) {
      console.error("Error deleting files:", delErr);
      setError("Failed to delete some files.");
    }
    await fetchFiles();
    setLoading(false);
  };

  const handleBack = () => {
    router.push("/vault");
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><span className="text-muted-foreground">Loading…</span></div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-6 flex flex-col md:flex-row gap-8 relative">
      {/* Main content: file list */}
      <div className="flex-1 min-w-0">
        {/* BACK BUTTON + TITLE */}
        <button
          onClick={handleBack}
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          &larr; Back to Vault
        </button>
        <h1 className="text-2xl font-semibold mb-6 text-gray-800">Case Files</h1>
        {/* SEARCH + UPLOAD + (DELETE IF SELECTED) */}
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {uploading ? "Uploading…" : "Upload files"}
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center px-4 py-2 border border-red-500 rounded text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        {/* LOADING / ERROR / FILE TABLE */}
        {loading && <p className="text-gray-600">Loading files…</p>}
        {error && <p className="text-red-500 mb-2">{error}</p>}
        {!loading && !error && (
          <FileList
            files={filteredFiles}
            selectedIds={selectedIds}
            onToggleAll={onToggleAll}
            onToggleOne={onToggleOne}
          />
        )}
      </div>
      {/* Metadata panel */}
      <aside
        className="w-full md:w-[340px] md:ml-8 flex-shrink-0"
        style={{ maxWidth: 380 }}
      >
        <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow-xl p-6 md:ml-auto md:mr-0 mx-auto md:mt-0 mt-8 min-h-[200px] flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-gray-900 tracking-tight">Case Metadata</h2>
            <button
              className="text-blue-500 hover:underline text-xs font-medium"
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? "Cancel" : "Edit"}
            </button>
          </div>
          {metaLoading ? (
            <p className="text-gray-400 text-sm">Loading metadata…</p>
          ) : metaError ? (
            <p className="text-red-500 text-sm">{metaError}</p>
          ) : caseMetadata ? (
            <div>
              {editMode ? (
                <form
                  className="space-y-2"
                  onSubmit={e => { e.preventDefault(); handleSaveMetadata(); }}
                >
                  {Object.entries(editMetadata).map(([key, value]) => {
                    const field = METADATA_FIELDS.find(f => f.key === key);
                    const label = field ? field.label : key.replace(/([A-Z])/g, ' $1');
                    const type = field ? field.type : 'text';
                    return (
                      <div key={key} className="flex flex-col gap-0.5">
                        <label className="text-xs text-gray-500 font-medium mb-0.5">{label}</label>
                        {type === 'textarea' ? (
                          <textarea
                            className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                            value={String(value)}
                            onChange={e => handleMetaChange(key, e.target.value)}
                          />
                        ) : (
                          <input
                            type={type}
                            className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                            value={String(value)}
                            onChange={e => handleMetaChange(key, e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                  {/* Add Field Dropdown */}
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    <select
                      className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-xs"
                      value={addFieldKey}
                      onChange={e => setAddFieldKey(e.target.value)}
                    >
                      <option value="">Add field…</option>
                      {METADATA_FIELDS.filter(f => !(f.key in editMetadata)).map(f => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                      <option value="custom">Custom Field…</option>
                    </select>
                    {addFieldKey === 'custom' && (
                      <input
                        type="text"
                        className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-xs max-w-[120px] truncate"
                        placeholder="Custom label"
                        value={customField}
                        onChange={e => setCustomField(e.target.value)}
                      />
                    )}
                    <button
                      type="button"
                      className="px-2 py-1 bg-blue-500 text-white rounded-md text-xs font-medium disabled:opacity-50"
                      disabled={!addFieldKey || (addFieldKey === 'custom' && !customField.trim())}
                      onClick={handleAddField}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-semibold disabled:opacity-50"
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-1.5 border border-gray-200 rounded-md text-sm"
                      onClick={() => setEditMode(false)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {Object.keys(caseMetadata).length === 0 && <p className="text-gray-400 text-sm">No metadata available.</p>}
                  <ul className="space-y-1 mt-2">
                    {Object.entries(caseMetadata).map(([key, value]) => (
                      <li key={key} className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-500 font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-gray-900 text-sm font-normal break-words">{String(value)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No metadata found.</p>
          )}
        </div>
      </aside>
    </div>
  );
};

export default VaultCasePage;
