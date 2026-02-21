import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            authAPI.getMe()
                .then((res) => setUser(res.data.data))
                .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        const res = await authAPI.login(credentials);
        const { user, token } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        toast.success(`Welcome back, ${user.firstName}!`);
        return user;
    };

    const register = async (data) => {
        const res = await authAPI.register(data);
        const { user, token } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        toast.success('Account created successfully!');
        return user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        toast.success('Logged out');
    };

    const updateUser = (data) => {
        const newUser = { ...user, ...data };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};
