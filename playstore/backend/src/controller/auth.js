import fs from "fs/promises";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db/pool.js"
import { logger, logActivity } from "../utils/logger.js";
import env from 'dotenv';

env.config();

const USERS_FILE = process.env.USERS_FILE;

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const RESET_SECRET = process.env.RESET_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;
const RESET_TOKEN_EXPIRY = process.env.RESET_TOKEN_EXPIRY;

async function getUsers() {
    const data = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(data);
}

async function saveUsers(users) {
    await fs.writeFile(
        USERS_FILE,
        JSON.stringify(users, null, 2)
    );
}

function generateAccessToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        JWT_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRY
        }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRY
        }
    );
}


async function signin(req,res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }
        console.log("sethupathi"); 

        const result = await pool.query('SELECT id,email, password FROM users WHERE email = $1', [email]);
        if (result.rows.length===0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        } 

        const passwordMatch = await bcrypt.compare(
            password,
            result.rows[0].password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }
        const user = {
            id:result.rows[0].id,
            email:result.rows[0].email
        };

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await pool.query(
      `INSERT INTO sessiontable (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshToken]
    );

        logActivity(user, "signed in");

        res.json({
            message: "Sign in successful 1",
            accessToken,
            refreshToken
        });

    } catch (error) {
        logger.error(error.stack || error.message);

        res.status(500).json({
            message: "Internal server error"
        });
    }
}


async function signup(req,res){
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users(username,email,password) VALUES ($1,$2,$3) RETURNING id,username, email, created_at',
            [name,email,hashedPassword]
        );

        const newUser = {
            id: result.rows[0].id,
            name,
            email,
            password: hashedPassword,
        };

        const accessToken = generateAccessToken(newUser);
        const refreshToken = generateRefreshToken(newUser);


        await pool.query(
      `INSERT INTO sessiontable (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [result.rows[0].id, refreshToken]
    );

        logActivity(newUser, "signed up");   

        res.status(201).json({
            result : result.rows[0],
            message: "User registered successfully 2",
            accessToken,
            refreshToken
        });

    } catch (error) {
        logger.error(error.stack || error.message);
        console.log(error)

        if(error.code=="23505"){
            res.status(409).json({
                message:"username already exist"
            })
        }

        res.status(500).json({
            mess:error,
            message: "Internal server error",
        });
    }
}


async function refreshToken(req,res) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token is required"
            });
        }

        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

        const users = await getUsers();

        const user = users.find(
            user => user.id === decoded.id
        );

        if (!user || !(user.refreshTokens || []).includes(refreshToken)) {
            return res.status(403).json({
                message: "Invalid refresh token"
            });
        }

        const accessToken = generateAccessToken(user);

        res.json({
            accessToken
        });

    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired refresh token"
        });
    }
}


async function logout(req,res) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token is required"
            });
        }

        const users = await getUsers();

        const user = users.find(
            user => (user.refreshTokens || []).includes(refreshToken)
        );

        if (user) {
            user.refreshTokens = user.refreshTokens.filter(
                token => token !== refreshToken
            );
            await saveUsers(users);

            logActivity(user, "logged out");
        }

        res.json({
            message: "Logged out successfully"
        });

    } catch (error) {
        logger.error(error.stack || error.message);

        res.status(500).json({
            message: "Internal server error"
        });
    }
}


async function logoutAll(req,res) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token is required"
            });
        }

        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

        const users = await getUsers();

        const user = users.find(
            user => user.id === decoded.id
        );

        if (!user) {
            return res.status(403).json({
                message: "Invalid refresh token"
            });
        }

        user.refreshTokens = [];
        await saveUsers(users);

        logActivity(user, "logged out from all devices");

        res.json({
            message: "Logged out from all devices"
        });

    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired refresh token"
        });
    }
}


async function forgotPassword(req,res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const users = await getUsers();

        const user = users.find(
            user => user.email === email
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const resetToken = jwt.sign(
            {
                id: user.id
            },
            RESET_SECRET,
            {
                expiresIn: RESET_TOKEN_EXPIRY
            }
        );

        user.resetToken = resetToken;
        await saveUsers(users);

        logActivity(user, "requested a password reset");

        res.json({
            message: "Reset token generated. In a real app this would be emailed instead of returned here",
            resetToken
        });

    } catch (error) {
        logger.error(error.stack || error.message);

        res.status(500).json({
            message: "Internal server error"
        });
    }
}


async function resetPassword(req,res) {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({
                message: "Reset token and new password are required"
            });
        }

        const decoded = jwt.verify(resetToken, RESET_SECRET);

        const users = await getUsers();

        const user = users.find(
            user => user.id === decoded.id
        );

        if (!user || user.resetToken !== resetToken) {
            return res.status(403).json({
                message: "Invalid or expired reset token"
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = null;
        user.refreshTokens = [];

        await saveUsers(users);

        logActivity(user, "reset their password");

        res.json({
            message: "Password reset successful. Please sign in again"
        });

    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired reset token"
        });
    }
}

export default {
    signin,
    signup,
    refreshToken,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword
}

// Access tokens are short-lived (15m) and verified by src/middlewares/auth.js on every protected route.
// Refresh tokens are long-lived (7d); each user can hold several at once (src/jsonfiles/users.json ->
// refreshTokens[]), one per signed-in device. /refresh-token trades a valid one for a new access token,
// /logout removes just that one, and /logout-all wipes every device's session at once.
// Forgot/reset password uses a separate short-lived (15m) resetToken stored on the user record and
// checked at /reset-password; resetting a password also clears all refreshTokens, forcing a fresh signin.
