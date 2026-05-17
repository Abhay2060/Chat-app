import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    emoji: {
      type: String,
      default: "💬",
    },
    accentColor: {
      type: String,
      default: "#4f8ef7",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },

    // Hashed password for auth (only for private rooms)
    password: {
      type: String,
      default: null,
    },

    // Plain-text password stored for display to members
    // bcrypt cannot be reversed, so we keep this separately
    // select:false means it is never returned unless explicitly requested
    plainPassword: {
      type: String,
      default: null,
      select: false,
    },

    // Short 6-digit room code, human-shareable (NOT the MongoDB _id)
    roomCode: {
      type: String,
      unique: true,
      index: true,
    },

    maxMembers: {
      type: Number,
      default: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Generate unique 6-digit roomCode before saving
roomSchema.pre("save", async function (next) {
  if (!this.roomCode) {
    let code;
    let exists = true;
    while (exists) {
      code = String(Math.floor(100000 + Math.random() * 900000));
      exists = await mongoose.model("Room").exists({ roomCode: code });
    }
    this.roomCode = code;
  }
  next();
});

// Hash password before saving
roomSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to verify password
roomSchema.methods.verifyPassword = async function (plainPassword) {
  if (!this.password) return false;
  return bcrypt.compare(plainPassword, this.password);
};

roomSchema.index({ name: "text", description: "text" });
roomSchema.index({ isActive: 1, isPrivate: 1 });
roomSchema.index({ createdBy: 1 });

const Room = mongoose.model("Room", roomSchema);
export default Room;