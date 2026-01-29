import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { authService } from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function getSession() {
            // Only set loading true on initial mount, not on every re-eval
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    if (mounted) setUser(session.user);

                    await authService.ensureProfileExists(session.user);
                    const profile = await authService.getMyProfile();

                    if (mounted) setIsAdmin(profile?.role === 'admin');
                } else {
                    if (mounted) {
                        setUser(null);
                        setIsAdmin(false);
                    }
                }
            } catch (error) {
                console.error('Auth load error:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setUser(session.user);
                // We might trigger a background profile refresh here if needed
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        user,
        isAdmin,
        loading,
        signInWithGoogle: async () => await supabase.auth.signInWithOAuth({ provider: 'google' }),
        signOut: async () => await supabase.auth.signOut(),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
