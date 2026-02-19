"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTokenFromUrl = useTokenFromUrl;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
function useTokenFromUrl() {
    const searchParams = (0, navigation_1.useSearchParams)();
    const [tokenLoaded, setTokenLoaded] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
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
