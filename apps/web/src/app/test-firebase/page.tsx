"use client";

import { useState, useEffect } from "react";
import {
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    User,
    signOut
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function FirebaseTestPage() {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [apiResponse, setApiResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                const idToken = await user.getIdToken();
                setToken(idToken);
            } else {
                setToken(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSignIn = async () => {
        try {
            setLoading(true);
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Sign in failed:", error);
            alert("Sign in failed. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = () => {
        signOut(auth);
        setApiResponse(null);
    };

    const verifyTokenWithApi = async () => {
        if (!token) return;

        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/auth/firebase-verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();
            setApiResponse(data);
        } catch (error) {
            console.error("API verification failed:", error);
            setApiResponse({ ok: false, message: "API connection failed" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto font-sans">
            <h1 className="text-3xl font-bold mb-6">Firebase Auth Demo</h1>

            {!user ? (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <p className="mb-4 text-blue-800">Please sign in to test the integration.</p>
                    <button
                        onClick={handleSignIn}
                        disabled={loading}
                        className="bg-white border border-gray-300 rounded px-4 py-2 flex items-center shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        <img src="https://www.gstatic.com/firebase/builtins/google.svg" className="w-5 h-5 mr-3" alt="Google" />
                        <span className="font-medium text-gray-700">Sign in with Google</span>
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200 flex items-center justify-between">
                        <div className="flex items-center">
                            {user.photoURL && <img src={user.photoURL} className="w-12 h-12 rounded-full mr-4" alt="User" />}
                            <div>
                                <p className="font-bold text-green-900">{user.displayName}</p>
                                <p className="text-green-700 text-sm">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                            Sign Out
                        </button>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h2 className="font-bold mb-2">ID Token</h2>
                        <div className="bg-white p-3 rounded border text-xs break-all overflow-auto max-h-32 mb-4 font-mono">
                            {token}
                        </div>
                        <button
                            onClick={verifyTokenWithApi}
                            disabled={loading}
                            className="bg-indigo-600 text-white font-bold py-2 px-6 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            Verify with API
                        </button>
                    </div>

                    {apiResponse && (
                        <div className={`p-6 rounded-lg border ${apiResponse.ok ? 'bg-indigo-50 border-indigo-200' : 'bg-red-50 border-red-200'}`}>
                            <h2 className={`font-bold mb-2 ${apiResponse.ok ? 'text-indigo-900' : 'text-red-900'}`}>API Response</h2>
                            <pre className="text-xs overflow-auto max-h-64 font-mono">
                                {JSON.stringify(apiResponse, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {loading && (
                <div className="fixed inset-0 bg-black/10 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            )}

            <div className="mt-8 text-sm text-gray-500 bg-gray-100 p-4 rounded">
                <p className="font-bold mb-1">Local Development Note:</p>
                <p>Ensure you have added the Firebase config to <code>apps/web/.env.local</code> and <code>apps/api/.env</code>. If using the emulator, make sure it is running on the appropriate ports.</p>
            </div>
        </div>
    );
}
