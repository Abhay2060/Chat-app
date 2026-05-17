import { sendTestEmail } from "../emails/emailHandlers.js";
import client from "../lib/redis.js";

export const resendOtp = async(req,res) =>{
    const {email} = req.body
    const cachedUser = await client.get(`user:${email}`);

    if (!cachedUser) {
        return res.status(400).json({
            message: "Session expired. Please signup again",
        });
    }
    
    const data = JSON.parse(cachedUser);
    try {
        if (data.blockedUntil && data.blockedUntil > Date.now()) {
            return res.status(429).json({
            message: "You are temporarily blocked. Try again later",
            });
        }
        if (data.otpAttempts >= 3) {
            const blockDuration = 10 * 60; // seconds

            data.blockedUntil = Date.now() + blockDuration * 1000;
            data.otpAttempts = 0;

            await client.set(`user:${email}`, JSON.stringify(data), {
            EX: blockDuration, // ✅ simple & correct (your case)
            });

            return res.status(429).json({
            message: "Too many attempts. Try again after 10 minutes",
            });
        }

        data.otpAttempts = (data.otpAttempts || 0) + 1;
        const newOtp = Math.floor(100000 + Math.random() * 900000)
        await client.set(`otp:${email}`, newOtp, { EX: 300 })
        await client.set(`user:${email}`, JSON.stringify(data), {KEEPTTL: true,});
        //jsoawait client.get(`user:${email}`)
        sendTestEmail(email,newOtp);
        
        res.status(200).json({
            success:true,
            message:"Here is your otp for verification"
        })
    } catch (error) {
        res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

export const resendOTP = async(req,res) =>{
    
    const {email} = req.body
    const cooldownkey =`resend_cool:${email}`
    const userKey = `user:${email}`
    const cachedUser = await client.get(userKey);
     

    const ttl = await client.get(cooldownkey);

    if (!cachedUser) {
        client.del(cooldownkey);
        client.del(userKey);
        return res.status(400).json({
            message: "Session expired. Please signup again",
        });
    }

    if(ttl>0){
        return res.status(429).json({
            message:"please wait before requesting another otp",
            retry_after: ttl
        })
    }

    try {
        const newOtp = Math.floor(100000 + Math.random() * 900000)
        await client.set(`otp:${email}`, newOtp, { EX: 300 })
        //jsoawait client.get(`user:${email}`)
        sendTestEmail(email,newOtp);
        
        return res.status(200).json({
            success:true,
            message:"Here is your otp for verification"
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}