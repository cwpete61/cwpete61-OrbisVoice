import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function useTokenFromUrl() {
  const searchParams = useSearchParams();
  const [tokenLoaded, setTokenLoaded] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // Store token in localStorage
      localStorage.setItem("token", token);
      // Clean up URL by removing token parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url);
    }
    // Mark that we've processed the token (whether found or not)
    setTokenLoaded(true);
  }, [searchParams]);

  return tokenLoaded;
}
