"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { app } from "@/lib/firebaseClient";
import { FirebaseError } from "firebase/app";
import { initFirebaseDebug } from "@/lib/firebase-debug";

export default function LoginPage() {
  const router = useRouter();
  const auth = getAuth(app);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Initialize debug logging
    initFirebaseDebug();
    
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Auth state changed - user logged in:", user.email);
        router.replace("/assistant");
      }
    });
    return () => unsub();
  }, [auth, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log("Attempting email login for:", email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Email login successful");
      router.replace("/assistant");
    } catch (err: unknown) {
      console.error("Login error:", err);
      if (err instanceof FirebaseError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log("Attempting email signup for:", email);
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Email signup successful");
      router.replace("/assistant");
    } catch (err: unknown) {
      console.error("Signup error:", err);
      if (err instanceof FirebaseError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError("Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Attempting Google login");
      const provider = new GoogleAuthProvider();
      // Add calendar scope
      provider.addScope('https://www.googleapis.com/auth/calendar');
      // Add redirect URI to match what's configured in Google Cloud Console
      provider.setCustomParameters({
        redirect_uri: typeof window !== 'undefined' ? 
          `${window.location.origin}/products/login` : 
          'http://localhost:9002/products/login'
      });
      const result = await signInWithPopup(auth, provider);
      // Extract and store Google OAuth access token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      if (accessToken) {
        localStorage.setItem('googleAccessToken', accessToken);
      }
      console.log("Google login successful");
      router.replace("/assistant");
    } catch (err: unknown) {
      console.error("Google login error:", err);
      if (err instanceof FirebaseError) {
        // Add more specific error handling for OAuth errors
        if (err.code === 'auth/popup-closed-by-user') {
          setError('Login popup was closed. Please try again.');
        } else if (err.code === 'auth/popup-blocked') {
          setError('Login popup was blocked. Please allow popups for this site.');
        } else {
          setError(err.message);
        }
      }
      else if (err instanceof Error) setError(err.message);
      else setError("Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 rounded-lg shadow-lg bg-white border">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in to LegalEase</h1>
        <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Icons.Sparkles className="animate-spin h-5 w-5" /> : isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>
        <div className="my-4 flex items-center justify-center">
          <span className="text-muted-foreground text-xs">or</span>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <Icons.Google className="h-5 w-5" /> Sign in with Google
        </Button>
        <div className="mt-4 text-center">
          {isSignUp ? (
            <span className="text-sm">Already have an account?{' '}
              <button type="button" className="text-primary underline" onClick={() => { setIsSignUp(false); setError(null); }}>
                Sign in
              </button>
            </span>
          ) : (
            <span className="text-sm">Don&apos;t have an account?{' '}
              <button type="button" className="text-primary underline" onClick={() => { setIsSignUp(true); setError(null); }}>
                Sign up
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 