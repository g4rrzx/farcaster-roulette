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
    walletAddress: string | null;
    isLoading: boolean;
    isConnected: boolean;
    error: string | null;
    tickets: number;
    setTickets: React.Dispatch<React.SetStateAction<number>>;
    setWalletAddress: React.Dispatch<React.SetStateAction<string | null>>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    walletAddress: null,
    isLoading: true,
    isConnected: false,
    error: null,
    tickets: 0,
    setTickets: () => { },
    setWalletAddress: () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FarcasterUser | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tickets, setTickets] = useState(0);

    useEffect(() => {
        async function initFarcaster() {
            try {
                const context = await sdk.context;

                if (context?.user) {
                    const userData = {
                        fid: context.user.fid,
                        username: context.user.username,
                        displayName: context.user.displayName,
                        pfpUrl: context.user.pfpUrl,
                    };
                    setUser(userData);

                    // Sync with backend database
                    try {
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                        const res = await fetch(`${apiUrl}/api/users/farcaster-login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(userData)
                        });

                        if (res.ok) {
                            const data = await res.json();
                            if (data.success && data.user) {
                                // Sync their ticket balance from the database!
                                setTickets(data.user.tickets);
                            }
                        }
                    } catch (e) {
                        console.error("Failed to sync user with backend:", e);
                    }
                }

                // Explicitly request the user's Farcaster linked wallet immediately
                try {
                    const provider = await sdk.wallet.ethProvider;
                    const accounts = await provider.request({ method: "eth_requestAccounts" });
                    const address = (accounts as string[])[0];
                    if (address) {
                        setWalletAddress(address);
                    }
                } catch (e) {
                    console.error("Failed to fetch eth_requestAccounts on load:", e);
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

    const isConnected = user !== null && walletAddress !== null;

    return (
        <AuthContext.Provider value={{ user, walletAddress, setWalletAddress, isLoading, isConnected, error, tickets, setTickets }}>
            {children}
        </AuthContext.Provider>
    );
}
