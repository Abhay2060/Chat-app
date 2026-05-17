import mongoose from "mongoose";
const tempUserSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  expiresAt: Date,
});

export default mongoose.model("TempUser", tempUserSchema);