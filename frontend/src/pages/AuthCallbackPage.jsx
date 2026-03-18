import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../api';
import FaceCodeLogo from '../components/FaceCodeLogo';

const AuthCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const code = searchParams.get('code');
        // We can infer provider from state or just try both if needed, 
        // but it's cleaner to handle per provider or use a generic callback.
        // For this implementation, we'll check if it's from Google or GitHub.
        
        const processAuth = async () => {
            if (!code) {
                setStatus('error');
                setErrorMsg('No authorization code found.');
                return;
            }

            try {
                // Try GitHub first if it looks like GitHub, or just try both.
                // In a real app, you'd pass the provider in the state param.
                // For simplicity, we'll try to determine based on search params 
                // or just default to one and catch.
                
                // Let's assume the backend has a generic callback or we check the referer.
                // Better: The redirect URL in the OAuth app should include the provider.
                // Redirect URI: http://localhost:5173/auth-callback?provider=github
                let provider = searchParams.get('provider') || 'google'; 

                const res = await api.get(`/api/auth/callback/${provider}`, { params: { code } });
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('username', res.data.username);
                setStatus('success');
                setTimeout(() => navigate('/practice'), 1500);
            } catch (err) {
                console.error("Auth callback failed:", err);
                setStatus('error');
                setErrorMsg(err.response?.data?.detail || 'Authentication failed.');
            }
        };

        processAuth();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl max-w-sm w-full text-center"
            >
                <div className="flex justify-center mb-6">
                    <FaceCodeLogo size={50} />
                </div>

                {status === 'loading' && (
                    <div className="space-y-4">
                        <Loader2 size={40} className="text-fc-primary animate-spin mx-auto" />
                        <h2 className="text-xl font-bold text-white tracking-tight">Verifying Identity</h2>
                        <p className="text-gray-400 text-sm">Securing your session with the AI engine...</p>
                    </div>
                )}

                {status === 'success' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-green-500">
                            <ShieldCheck size={28} />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Authenticated!</h2>
                        <p className="text-gray-400 text-sm">Welcome back. Redirecting to your workspace...</p>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <AlertCircle size={40} className="text-red-500 mx-auto" />
                        <h2 className="text-xl font-bold text-white tracking-tight">Auth Failed</h2>
                        <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="mt-4 text-xs font-bold text-fc-primary uppercase tracking-widest hover:underline"
                        >
                            Try Again
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default AuthCallbackPage;
