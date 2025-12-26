import { Schema, model, models, Document } from "mongoose";
// definging the interface for User which makes the Schema type-safe
export interface IUser extends Document {
  clerkId?: string; 
  name: string;
  email: string;
  password?: string;
  picture?: string;
  role: "USER" | "ADMIN";
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  picture: { type: String },
  role: { type: String, default: "USER" },
}, { timestamps: true });

const User = models.User || model("User", UserSchema);
export default User;