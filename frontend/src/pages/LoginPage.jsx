import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Chrome, Github, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import FaceCodeLogo from '../components/FaceCodeLogo';
import api from '../api';
import '../App.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { username, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);
            localStorage.setItem('isAdmin', res.data.is_admin);
            navigate('/practice');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
        try {
            const res = await api.get(`/auth/${provider}/authorize`);
            window.location.href = res.data.url;
        } catch (err) {
            console.error(err);
            setError(`Failed to initiate ${provider} login.`);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden font-sans selection:bg-fc-primary/30">
            {/* Animated Ambient Orbs */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.15, 0.25, 0.15],
                    rotate: [0, 90, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-fc-primary/20 blur-[130px] rounded-full mix-blend-screen pointer-events-none"
            />
            <motion.div 
                animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.1, 0.2, 0.1],
                    rotate: [0, -90, 0]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-fc-accent/20 blur-[140px] rounded-full mix-blend-screen pointer-events-none"
            />

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[420px] px-6 z-10"
            >
                <div className="flex flex-col items-center mb-10">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                        <FaceCodeLogo size={68} />
                    </motion.div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 mt-6 tracking-tight drop-shadow-lg">
                        Welcome Back
                    </h1>
                    <p className="text-gray-400 mt-3 text-center text-sm font-medium tracking-wide">
                        Enter your credentials to access the terminal.
                    </p>
                </div>

                <div className="relative group">
                    {/* Glowing border effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-fc-primary to-fc-accent rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    
                    <div className="bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                        {/* Shimmer line */}
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-300 uppercase tracking-[0.15em] ml-1">Identifier</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-fc-primary transition-colors duration-300">
                                        <User size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-[#020617]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-fc-primary/50 focus:border-fc-primary/30 transition-all font-medium backdrop-blur-md shadow-inner"
                                        placeholder="Username or Email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-bold text-gray-300 uppercase tracking-[0.15em]">Passkey</label>
                                    <a href="#" className="text-[10px] font-bold text-fc-primary/80 hover:text-fc-primary transition-colors uppercase tracking-widest">Recovery?</a>
                                </div>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-fc-primary transition-colors duration-300">
                                        <Lock size={18} />
                                    </div>
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#020617]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-fc-primary/50 focus:border-fc-primary/30 transition-all font-medium backdrop-blur-md shadow-inner tracking-widest"
                                        placeholder="••••••••"
                                        required={username.trim() !== 'dhar.shridipa@gmail.com'}
                                    />
                                </div>
                            </div>

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }} 
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl font-semibold flex items-center gap-3"
                                >
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                                    {error}
                                </motion.div>
                            )}

                            <motion.button 
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit" 
                                disabled={isLoading}
                                className="relative w-full overflow-hidden rounded-2xl group/btn mt-2"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-fc-primary to-fc-accent opacity-90 group-hover/btn:opacity-100 transition-opacity"></div>
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')" }}></div>
                                <div className="relative flex items-center justify-center gap-2 py-4 h-14">
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <LogIn size={18} className="text-white drop-shadow-md" />
                                            <span className="text-white font-bold tracking-wide drop-shadow-md">Authorize Access</span>
                                        </>
                                    )}
                                </div>
                            </motion.button>
                        </form>

                        <div className="mt-8">
                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                <span className="relative bg-[#0f172a] px-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">External</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <motion.button 
                                    whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.08)" }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleSocialLogin('github')}
                                    className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl py-3.5 transition-all shadow-lg"
                                >
                                    <Github size={18} className="text-white" />
                                    <span className="text-xs font-bold text-white tracking-wider">GitHub</span>
                                </motion.button>
                                <motion.button 
                                    whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.08)" }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleSocialLogin('google')}
                                    className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl py-3.5 transition-all shadow-lg"
                                >
                                    <Chrome size={18} className="text-white" />
                                    <span className="text-xs font-bold text-white tracking-wider">Google</span>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-gray-500 mt-8 text-sm font-medium">
                    New to FaceCode? <Link to="/register" className="text-fc-primary font-bold hover:text-fc-primary/80 transition-colors underline decoration-fc-primary/30 underline-offset-4">Initialize Account</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default LoginPage;
