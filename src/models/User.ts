// Add missing mongoose import for Model
import mongoose, { Model, Schema, Document, ObjectId } from "mongoose";
import bcrypt from "bcryptjs";

// Combine the Document type with our custom methods
export interface IUser extends Document {
	_id: string;
	name: string;
	email: string;
	password: string;
	role: string;
	banned: boolean;
	lastLogin: Date;
	matchPassword(enteredPassword: string): Promise<boolean>;
	workspacesObjects: mongoose.Types.ObjectId[];
	chats: mongoose.Types.ObjectId[];
}
// Create a type that knows about both the document and methods
type UserModel = Model<IUser>;

const userSchema = new Schema<IUser, UserModel>(
	{
	  name: { type: String, required: true },
	  email: { type: String, required: true, unique: true },
	  password: { type: String, required: true },
	  role: { type: String, enum: ['user', 'admin'], default: 'user' },
	  banned: { type: Boolean, default: false },
	  lastLogin: { type: Date, default: Date.now },
	  workspacesObjects: [{ type: Schema.Types.ObjectId, ref: "Workspace" }],
	  chats: [{ type: Schema.Types.ObjectId, ref: "Chats" }],
	},
	{ timestamps: true }
  );
  

// This automatically hashes the "password" field, it is localized so that you dont have to call it manually
userSchema.pre<IUser>("save", async function (this: IUser, next) {
	if (!this.isModified("password")) return next();

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

userSchema.methods.matchPassword = async function (
	enteredPassword: string
): Promise<boolean> {
	return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser, UserModel>("User", userSchema);
export default User;
