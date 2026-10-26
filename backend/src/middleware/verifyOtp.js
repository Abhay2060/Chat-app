import client from "../lib/redis.js";
import { generateToken } from "../lib/utils.js";
import Tempuser from "../models/Tempuser.js";
import User from "../models/User.js";

// export const verifyOTP = async (req,res) =>{
//     try{
//         const {email,otp} = req.body;
//         const storedOTP = await client.get(`otp:${email}`);
//         const userData = JSON.parse(await client.get(`user:${email}`))
//         const verifyData = await client.get(`verify:${email}`);
//         if(!verifyData){
//             return res.status(400).json({message: "Session expired. Please signup again"});
//         }
//         const verify = JSON.parse(verifyData);
//         const ttl = await client.ttl(`otp:${email}`)

//         if(verify.verifyAttempts>=5){
//             verify.verifyAttempts = 0;
//             verify.blockedUntil = userData.blockedUntil;
//             await client.set(`verify:${email}`, JSON.stringify(verify), {EX: ttl});
            
//         }

//         if (verify.blockedUntil && verify.blockedUntil > Date.now()) {
//                 return res.status(429).json({
//                 message: "You are temporarily blocked. Try again later",
//             });
//         }

//         if(!storedOTP){
//             verify.verifyAttempts += 1;
//             await client.set(`verify:${email}`,JSON.stringify(verify),{KEEPTTL: true});
//             return res.status(400).json({
//                 success:false,
//                 message:"otp expired"
//             })
//         }
//         if(storedOTP!==String(otp)){
//             verify.verifyAttempts += 1;
//             await client.set(`verify:${email}`,JSON.stringify(verify),{KEEPTTL: true});
//             return res.status(500).json({
//                 success:false,
//                 message:"Invalid OTP"
//             })
//         }
//         const newUser = await User.create({
//             fullName: userData.fullName,
//             email: userData.email,
//             password: userData.password,
//         });

//         generateToken(newUser._id, res);
//         await client.del(`otp:${email}`);
//         await client.del(`user:${email}`);

//         return res.status(200).json({
//             _id: newUser._id,
//             fullName: newUser.fullName,
//             email: newUser.email,
//             profilePic: newUser.profilePic,
//         });

//     }catch (err) {
//         console.error(err);
//         return res.status(500).json({
//             success:false,
//             message:"Internal server Error",
//         })
//     }
// }

export const verifyOTP = async (req,res) =>{
    try{
        const {email,otp} = req.body;
        const attemptsKey = `verify:${email}`
        const userKey = `user:${email}`
        const blockKey = `block:${email}`
        const otpKey = `otp:${email}`
        const attempts = await client.incr(attemptsKey);
        const storedOTP = await client.get(otpKey);

        const blockttl = await client.ttl(blockKey);

        if(blockttl>0){
            return res.status(429).json({
                success:false,
                message:`Too many verfication request${blockttl}`
            })
        }

        if (attempts === 1) {
        const ttl = await client.ttl(userKey)
        await client.expire(attemptsKey, ttl); 
        }

        if (attempts >= 5) {
        await client.expire(blockKey,600);
        }
        
        if(!storedOTP){
            return res.status(400).json({
                success:false,
                message:"otp expired"
            })
        }
        if(storedOTP!==String(otp)){
            return res.status(500).json({
                success:false,
                message:"Invalid OTP"
            })
        }

        // ✅ Fetch user data from Redis and create the user in MongoDB
        const rawUserData = await client.get(userKey);
        if (!rawUserData) {
            return res.status(400).json({
                success: false,
                message: "Session expired. Please signup again",
            });
        }
        const userData = JSON.parse(rawUserData);

        const newUser = await User.create({
            fullName: userData.fullName,
            email: userData.email,
            password: userData.password,
        });

        generateToken(newUser._id, res);
        await client.del(otpKey);
        await client.del(userKey);
        await client.del(blockKey);
        await client.del(attemptsKey);

        return res.status(200).json({
            _id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            profilePic: newUser.profilePic,
        });
        
    }catch (err) {
        console.error(err);
        return res.status(500).json({
            success:false,
            message:"Internal server Error",
        })
    }
}
