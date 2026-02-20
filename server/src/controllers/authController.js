const authService = require('../services/authService');

const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await authService.getProfile(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe };
