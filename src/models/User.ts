
// Add missing mongoose import for Model
import mongoose, { Model,Schema, Document, ObjectId } from "mongoose";
import bcrypt from "bcryptjs";


// Combine the Document type with our custom methods
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
}

// Create a type that knows about both the document and methods
type UserModel = Model<IUser>;

const userSchema = new Schema<IUser, UserModel>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

// Pre-save middleware with proper this typing
userSchema.pre<IUser>('save', async function(this: IUser, next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model<IUser, UserModel>("User", userSchema);
export default User;