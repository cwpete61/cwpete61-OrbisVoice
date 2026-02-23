"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function IdleTimeoutModal({
    isAdmin,
}: {
    isAdmin?: boolean;
}) {
    const router = useRouter();
    const [showPrompt, setShowPrompt] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);

    const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/");
    };

    const resetTimer = () => {
        if (isAdmin) return;

        setShowPrompt(false);
        setTimeLeft(60);

        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        // 10 minutes idle timeout
        idleTimeoutRef.current = setTimeout(() => {
            setShowPrompt(true);

            // Countdown 60 seconds
            countdownIntervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleLogout();
                        return 0; // stop counting
                    }
                    return prev - 1;
                });
            }, 1000);

        }, 600000); // 10 minutes
    };

    useEffect(() => {
        if (isAdmin) {
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            return;
        }

        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
        const handleEvent = () => {
            if (!showPrompt) {
                resetTimer();
            }
        };

        events.forEach((event) => window.addEventListener(event, handleEvent));

        resetTimer();

        return () => {
            events.forEach((event) => window.removeEventListener(event, handleEvent));
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [isAdmin, showPrompt]);

    const handleStayLoggedIn = () => {
        resetTimer();
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="bg-[#080c16] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#14b8a6] to-transparent opacity-50"></div>

                <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#14b8a6]/10 flex items-center justify-center ring-1 ring-[#14b8a6]/30">
                        <span className="text-3xl font-bold text-[#14b8a6]">{timeLeft}</span>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Are you still there?</h2>
                <p className="text-[rgba(240,244,250,0.6)] mb-8 text-sm leading-relaxed">
                    You have been idle for a while. You will be automatically logged out in <span className="text-white font-medium">{timeLeft}</span> seconds for your security.
                </p>

                <div className="flex gap-3 w-full">
                    <button
                        onClick={handleLogout}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-medium transition-all text-sm"
                    >
                        Log Out
                    </button>
                    <button
                        onClick={handleStayLoggedIn}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#14b8a6] text-white hover:bg-[#0d9488] font-medium transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] text-sm"
                    >
                        I&apos;m still here
                    </button>
                </div>
            </div>
        </div>
    );
}
