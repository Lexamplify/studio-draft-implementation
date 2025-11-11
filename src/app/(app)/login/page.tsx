"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Email login successful");
      
      // Store authentication info for editor access
      if (userCredential.user) {
        const authData = {
          isAuthenticated: true,
          user: {
            email: userCredential.user.email,
            uid: userCredential.user.uid,
            displayName: userCredential.user.displayName
          },
          loginTime: Date.now(),
          loginMethod: 'email'
        };
        localStorage.setItem('mainWebsiteAuth', JSON.stringify(authData));
        console.log('✅ Main website email login success - Auth data stored for editor:', authData);
      }
      
      router.replace("/assistant");
    } catch (err: unknown) {
      console.error("Login error:", err);
      
      // Store error info for editor access
      const errorMessage = err instanceof FirebaseError ? err.message : 
                          err instanceof Error ? err.message : 
                          "Login failed";
      
      const errorData = {
        hasError: true,
        errorMessage,
        errorTime: Date.now(),
        errorType: 'email_login'
      };
      localStorage.setItem('mainWebsiteAuthError', JSON.stringify(errorData));
      console.log('❌ Main website email login failure - Error data stored for editor:', errorData);
      
      if (err instanceof FirebaseError) {setError(err.message);
        setLoading(false);

      }
      else if (err instanceof Error) {setError(err.message);
        setLoading(false);

      }
      else {setError("Login failed");
        setLoading(false);

      }
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
          `${window.location.origin}/login` : 
          'http://localhost:3000/login'
      });
      const result = await signInWithPopup(auth, provider);
      // Extract and store Google OAuth access token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      console.log("Credential:", credential);
      console.log("Access Token:", accessToken);
      console.log("Result:", result);
      
      if (accessToken) {
        localStorage.setItem('googleAccessToken', accessToken);
        // Set expiry to 1 hour from now (Google tokens expire in 1 hour)
        const expiryTime = Date.now() + (60 * 60 * 1000);
        localStorage.setItem('googleTokenExpiry', expiryTime.toString());
        console.log("✅ Google login successful - Token stored");
      } else {
        console.warn("⚠️ Google login successful but no access token retrieved");
        // For now, store a placeholder to indicate Google login happened
        // The user will need to grant calendar permissions separately
        localStorage.setItem('googleLoginCompleted', 'true');
      }
      
      // Store authentication info for editor access
      if (result.user) {
        const authData = {
          isAuthenticated: true,
          user: {
            email: result.user.email,
            uid: result.user.uid,
            displayName: result.user.displayName
          },
          loginTime: Date.now(),
          loginMethod: 'google',
          googleAccessToken: accessToken
        };
        localStorage.setItem('mainWebsiteAuth', JSON.stringify(authData));
        console.log('✅ Main website Google login success - Auth data stored for editor:', authData);
      }
      
      router.replace("/assistant");
    } catch (err: unknown) {
      console.error("Google login error:", err);
      if (err instanceof FirebaseError) {
        // Add more specific error handling for OAuth errors
        if (err.code === 'auth/popup-closed-by-user') {
          setError('Login popup was closed. Please try again.');
          setLoading(false);

        } else if (err.code === 'auth/popup-blocked') {
          setError('Login popup was blocked. Please allow popups for this site.');
          setLoading(false);

        } else {
          setError(err.message);
          setLoading(false);

        }
      }
      else if (err instanceof Error) {
        setError(err.message);
        setLoading(false);
      }
      else {
        setError("Google login failed");
        setLoading(false);
      }
      
      // Store error info for editor access
      const errorMessage = err instanceof FirebaseError ? err.message : 
                          err instanceof Error ? err.message : 
                          "Google login failed";
      
      const errorData = {
        hasError: true,
        errorMessage,
        errorTime: Date.now(),
        errorType: 'google_login'
      };
      localStorage.setItem('mainWebsiteAuthError', JSON.stringify(errorData));
      console.log('❌ Main website Google login failure - Error data stored for editor:', errorData);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 rounded-lg shadow-lg bg-white border">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in to LegalEase</h1>
        <form onSubmit={handleEmailLogin} className="space-y-4">
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
            {loading ? <Icons.Sparkles className="animate-spin h-5 w-5" /> : "Sign In"}
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
      </div>
    </div>
  );
} 