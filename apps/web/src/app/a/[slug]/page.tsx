"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function AffiliateRedirectPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;

    useEffect(() => {
        if (slug) {
            // Store affiliate slug for 30 days (attribution window)
            // In a real app, this should also check if the slug is valid via API
            localStorage.setItem("affiliate_slug", slug);
            localStorage.setItem("affiliate_timestamp", Date.now().toString());

            // Redirect to homepage or signup
            router.push("/signup");
        } else {
            router.push("/");
        }
    }, [slug, router]);

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-[#05080f] text-[#f0f4fa]">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#14b8a6] border-t-transparent" />
            <p className="mt-4 text-sm font-medium animate-pulse">Setting up your referral...</p>
        </div>
    );
}
