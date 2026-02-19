"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import sdk from "@farcaster/frame-sdk";

interface FarcasterUser {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
}

interface AuthContextType {
    user: FarcasterUser | null;
    isLoading: boolean;
    isConnected: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isConnected: false,
    error: null,
});

export function useAuth() {
    return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FarcasterUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function initFarcaster() {
            try {
                const context = await sdk.context;

                if (context?.user) {
                    setUser({
                        fid: context.user.fid,
                        username: context.user.username,
                        displayName: context.user.displayName,
                        pfpUrl: context.user.pfpUrl,
                    });
                }

                // Signal to Farcaster that the frame is ready
                sdk.actions.ready();
            } catch (err) {
                console.error("Failed to init Farcaster SDK:", err);
                setError("Failed to connect to Farcaster");
            } finally {
                setIsLoading(false);
            }
        }

        initFarcaster();
    }, []);

    const isConnected = user !== null;

    return (
        <AuthContext.Provider value={{ user, isLoading, isConnected, error }}>
            {children}
        </AuthContext.Provider>
    );
}
