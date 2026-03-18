import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, Github, Chrome, LogIn } from 'lucide-react';
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
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden p-6"
        >
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fc-primary opacity-10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fc-accent opacity-10 blur-[120px] rounded-full"></div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="flex flex-col items-center mb-8">
                    <FaceCodeLogo size={60} />
                    <h1 className="text-3xl font-extrabold text-white mt-4 tracking-tight">Welcome Back</h1>
                    <p className="text-gray-400 mt-2 text-center text-sm">Sign in to continue your AI-powered coding journey.</p>
                </div>

                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fc-primary to-fc-accent opacity-50"></div>
                    
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-fc-primary transition-colors">
                                    <User size={18} />
                                </div>
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-fc-primary/30 focus:border-fc-primary/50 transition-all font-medium"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
                                <a href="#" className="text-[10px] font-bold text-fc-primary hover:underline uppercase tracking-widest opacity-80">Forgot Password?</a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-fc-primary transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-fc-primary/30 focus:border-fc-primary/50 transition-all font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2.5 px-4 rounded-xl font-bold flex items-center gap-2"
                            >
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                {error}
                            </motion.div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-fc-primary to-fc-accent hover:opacity-90 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-fc-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 h-14"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    <span>Sign In</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/5"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#0f172a] px-3 py-1 rounded-full text-gray-500 font-bold tracking-widest">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <button 
                                onClick={() => handleSocialLogin('github')}
                                className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl py-3 transition-all"
                            >
                                <Github size={20} className="text-white" />
                                <span className="text-xs font-bold text-white tracking-wide">Github</span>
                            </button>
                            <button 
                                onClick={() => handleSocialLogin('google')}
                                className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl py-3 transition-all"
                            >
                                <Chrome size={20} className="text-white" />
                                <span className="text-xs font-bold text-white tracking-wide">Google</span>
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-gray-500 mt-8 text-sm font-medium">
                    Don't have an account? <Link to="/register" className="text-fc-primary font-bold hover:underline">Create Account</Link>
                </p>
            </motion.div>
        </motion.div>
    );
};

export default LoginPage;
