
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

// this automatically hashes the "password" field, it is localized so that i dont have to call it manually
userSchema.pre<IUser>('save', async function(this: IUser, next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model<IUser, UserModel>("User", userSchema);
export default User;