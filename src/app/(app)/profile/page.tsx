"use client";
import { useEffect, useState, useRef } from "react";
import { useFirebaseUser } from "@/hooks/use-firebase-user";
import { db } from "@/lib/firebaseClient";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function ProfilePage() {
  const { user, loading: authLoading } = useFirebaseUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [barCouncilId, setBarCouncilId] = useState("");
  const [enrollmentYear, setEnrollmentYear] = useState("");
  const [practiceAreas, setPracticeAreas] = useState("");
  const [lawFirm, setLawFirm] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile from Firestore
  useEffect(() => {
    if (authLoading || !user) return;
    setLoading(true);
    setError(null);
    const fetchProfile = async () => {
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setPhone(data.phone || "");
          setDob(data.dob || "");
          setGender(data.gender || "");
          setAddress(data.address || "");
          setBarCouncilId(data.barCouncilId || "");
          setEnrollmentYear(data.enrollmentYear || "");
          setPracticeAreas(data.practiceAreas || "");
          setLawFirm(data.lawFirm || "");
          setWebsite(data.website || "");
          setLinkedin(data.linkedin || "");
        } else {
          // If no profile, create a default one
          const defaultProfile = {
            firstName: user.displayName?.split(" ")[0] || "",
            lastName: user.displayName?.split(" ")[1] || "",
            email: user.email,
            phone: "",
            dob: "",
            gender: "",
            address: "",
            barCouncilId: "",
            enrollmentYear: "",
            practiceAreas: "",
            lawFirm: "",
            website: "",
            linkedin: "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(ref, defaultProfile);
          setFirstName(defaultProfile.firstName);
          setLastName(defaultProfile.lastName);
          setPhone("");
          setDob("");
          setGender("");
          setAddress("");
          setBarCouncilId("");
          setEnrollmentYear("");
          setPracticeAreas("");
          setLawFirm("");
          setWebsite("");
          setLinkedin("");
        }
      } catch (err) {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authLoading, user]);

  // Save handler
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        firstName,
        lastName,
        phone,
        dob,
        gender,
        address,
        barCouncilId,
        enrollmentYear,
        practiceAreas,
        lawFirm,
        website,
        linkedin,
        updatedAt: serverTimestamp(),
      });
      setEditMode(false);
    } catch (err) {
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePic(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><span className="text-muted-foreground">Loading…</span></div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-[40vh]"><span className="text-red-500">{error}</span></div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 bg-gradient-to-br from-blue-50 to-white">
      <div className="bg-white/95 backdrop-blur border border-gray-100 rounded-2xl shadow-2xl p-8 w-full max-w-2xl flex flex-col gap-8 items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl font-bold text-blue-600 mb-2 shadow overflow-hidden border-4 border-white">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="object-cover w-full h-full rounded-full" />
              ) : (
                <span>{firstName?.[0] || "U"}</span>
              )}
            </div>
            {editMode && (
              <button
                type="button"
                className="absolute bottom-2 right-2 bg-white/80 rounded-full p-1 shadow hover:bg-blue-100 border border-blue-200 transition"
                onClick={() => fileInputRef.current?.click()}
                title="Change profile picture"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 7.5h18M4.5 21h15a1.5 1.5 0 001.5-1.5V7.5a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 7.5v12A1.5 1.5 0 004.5 21zM15.75 11.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePicChange}
            />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 text-center mt-2">{firstName} {lastName}</h1>
          <p className="text-gray-500 text-base">{user?.email}</p>
        </div>
        {!editMode && (
          <button
            type="button"
            className="px-5 py-2 border border-blue-200 rounded-lg text-base font-medium shadow hover:bg-blue-50 transition mb-2"
            onClick={() => setEditMode(true)}
          >
            Edit Profile
          </button>
        )}
        <form className="flex flex-col gap-4 w-full max-w-2xl mx-auto" onSubmit={e => { e.preventDefault(); if (editMode) handleSave(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">First Name</label>
              <input
                className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                disabled={!editMode}
                placeholder="First Name"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Last Name</label>
              <input
                className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                disabled={!editMode}
                placeholder="Last Name"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Phone</label>
              <input
                className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                disabled={!editMode}
                placeholder="Phone"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Date of Birth</label>
              <input
                type="date"
                className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={dob}
                onChange={e => setDob(e.target.value)}
                disabled={!editMode}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Gender</label>
              <select
                className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={gender}
                onChange={e => setGender(e.target.value)}
                disabled={!editMode}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Bar Council ID</label>
              <input
                className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={barCouncilId}
                onChange={e => setBarCouncilId(e.target.value)}
                disabled={!editMode}
                placeholder="Bar Council ID"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Enrollment Year</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={enrollmentYear}
                onChange={e => setEnrollmentYear(e.target.value)}
                disabled={!editMode}
                placeholder="Year"
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Practice Areas (comma separated)</label>
              <input
                className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={practiceAreas}
                onChange={e => setPracticeAreas(e.target.value)}
                disabled={!editMode}
                placeholder="e.g. Criminal, Civil, Corporate"
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Law Firm / Chamber</label>
              <input
                className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={lawFirm}
                onChange={e => setLawFirm(e.target.value)}
                disabled={!editMode}
                placeholder="Law Firm or Chamber Name"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Website</label>
              <input
                type="url"
                className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                disabled={!editMode}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">LinkedIn</label>
              <input
                type="url"
                className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
                disabled={!editMode}
                placeholder="LinkedIn Profile URL"
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Address</label>
              <textarea
                className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 min-h-[40px]"
                value={address}
                onChange={e => setAddress(e.target.value)}
                disabled={!editMode}
                placeholder="Address"
              />
            </div>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-2 mt-2 justify-center">
            {editMode && (
              <>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-base font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="px-5 py-2 border border-gray-200 rounded-lg text-base font-medium shadow hover:bg-gray-100 transition"
                  onClick={() => setEditMode(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
} 