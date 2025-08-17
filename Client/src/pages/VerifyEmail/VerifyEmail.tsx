// src/pages/VerifyEmail.tsx
import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase"; // <-- adjust path to your firebase.ts
import { onAuthStateChanged, reload, sendEmailVerification,type User } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login");
      } else {
        setUser(u);
        await reload(u);
        setEmailVerified(u.emailVerified);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Poll every few seconds in case user verified email in another tab
  useEffect(() => {
    console.log(user);
    const interval = setInterval(async () => {
      if (user && !user.emailVerified) {
        await reload(user);
        if (user.emailVerified) {
          setEmailVerified(true);
          navigate("/");
        }
      }
    }, 5000); // check every 5s

    return () => clearInterval(interval);
  }, [user, navigate]);

  const handleResendVerification = async () => {
    if (!user) return;
    setSending(true);
    try {
      await sendEmailVerification(user);
      alert("Verification email sent again! Check your inbox.");
    } catch (err) {
      console.error(err);
      alert("Error sending verification email.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      {emailVerified ? (
        <p className="text-green-600 text-xl font-semibold">Email verified! Redirecting...</p>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">Verify your email</h1>
          <p className="mb-6">
            A verification link has been sent to <strong>{user?.email}</strong>.  
            Please check your inbox (and spam folder).
          </p>
          <button
            onClick={handleResendVerification}
            disabled={sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Resend Verification Email"}
          </button>
        </>
      )}
    </div>
  );
}
