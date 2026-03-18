import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Mail, ArrowRight, Github, Chrome, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import FaceCodeLogo from '../components/FaceCodeLogo';
import api from '../api';
import '../App.css';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/register', { 
                username, 
                password, 
                full_name: fullName 
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);
            navigate('/practice');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Username may already be taken.');
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
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-fc-primary opacity-10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fc-accent opacity-10 blur-[120px] rounded-full"></div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="flex flex-col items-center mb-8">
                    <FaceCodeLogo size={60} />
                    <h1 className="text-3xl font-extrabold text-white mt-4 tracking-tight">Create Account</h1>
                    <p className="text-gray-400 mt-2 text-center text-sm">Join the elite community of AI-powered developers.</p>
                </div>

                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fc-accent to-fc-primary opacity-50"></div>
                    
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-fc-primary transition-colors">
                                    <User size={18} />
                                </div>
                                <input 
                                    type="text" 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-fc-primary/30 focus:border-fc-primary/50 transition-all font-medium"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-fc-primary transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-fc-primary/30 focus:border-fc-primary/50 transition-all font-medium"
                                    placeholder="Choose a username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-fc-primary transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-fc-primary/30 focus:border-fc-primary/50 transition-all font-medium"
                                    placeholder="Create a strong password"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2.5 px-4 rounded-xl font-bold"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-fc-accent to-fc-primary hover:opacity-90 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-fc-accent/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-6 h-14"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    <span>Create Account</span>
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
                                <span className="bg-[#0f172a] px-3 py-1 rounded-full text-gray-500 font-bold tracking-widest">Connect with</span>
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
                    Already have an account? <Link to="/login" className="text-fc-primary font-bold hover:underline">Sign In</Link>
                </p>
            </motion.div>
        </motion.div>
    );
};

export default RegisterPage;
