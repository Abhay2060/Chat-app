import client from "../lib/redis.js";
import User from "../models/User.js";
import bcryptjs from "bcryptjs";

export const isPasswordMatch = async (pass,hashPass) => {
    const isCorrect = await bcryptjs.compare(pass,hashPass);
    return isCorrect;
}

export const hashPassword = async(pass) =>{
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(pass, salt);

    return hashPassword;
}

export const cachedUser = async(key) =>{
    const user = await client.get(key);
    return user ? JSON.parse(user) : null;
}

export const setupCache = async(key,userData) => {
    await client.set(key,JSON.stringify(userData),{EX: 600});
    await client.set("sendOtpAttempts",1,{EX:600});
    await client.set("verifyOtpAttemps",1,{EX:600});
    await client.set("blockedUntil",null,{EX:600});
}