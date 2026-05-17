import crypto from "crypto";
import client from "../lib/redis.js";

export const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

export const otpIncr = async(key) =>{
    await client.incr(key);
}

export const otpAttempts = async(key) =>{
    const count = await client.get(key);
    return count;
} 

export const verifyOtpIncr = async() =>{
    await client.incr(key);
}