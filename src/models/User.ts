import mongoose, { Schema, Document, ObjectId } from "mongoose";
import bcrypt from "bcryptjs";

interface IWorkspace {
  name: string;
  id: string;
  children?: IWorkspace[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Extended methods interface for TypeScript support
interface IUserMethods {
  matchPassword(enteredPassword: string): Promise<boolean>;
  addWorkspace(workspace: IWorkspace): Promise<void>;
  updateWorkspace(workspaceId: string, updates: Partial<IWorkspace>): Promise<boolean>;
  deleteWorkspace(workspaceId: string): Promise<boolean>;

}

// Combine the Document type with our custom methods
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  workspaces: IWorkspace[];
}

// Create a type that knows about both the document and methods
type UserModel = Model<IUser, {}, IUserMethods>;

const workspaceSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    id: { type: String, required: true },
    children: [{ type: Schema.Types.Mixed }]
  },
  { timestamps: true }
);

const userSchema = new Schema<IUser, UserModel>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    workspaces: [workspaceSchema]
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

// Methods with proper this typing
userSchema.methods.matchPassword = async function(
  this: IUser & IUserMethods,
  enteredPassword: string
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.addWorkspace = async function(
  this: IUser & IUserMethods,
  workspace: IWorkspace
): Promise<void> {
  this.workspaces.push(workspace);
  await this.save();
};

userSchema.methods.updateWorkspace = async function(
  this: IUser & IUserMethods,
  workspaceId: string,
  updates: Partial<IWorkspace>
): Promise<boolean> {
  const workspace = this.workspaces.find(w => w.id === workspaceId);
  if (!workspace) return false;
  
  Object.assign(workspace, updates);
  await this.save();
  return true;
};

userSchema.methods.deleteWorkspace = async function(
  this: IUser & IUserMethods,
  workspaceId: string
): Promise<boolean> {
  const initialLength = this.workspaces.length;
  this.workspaces = this.workspaces.filter(w => w.id !== workspaceId);
  
  if (this.workspaces.length === initialLength) return false;
  
  await this.save();
  return true;
};

userSchema.methods.addChildToWorkspace = async function(
  this: IUser & IUserMethods,
  workspaceId: string,
  child: IWorkspace
): Promise<boolean> {
  const workspace = this.workspaces.find(w => w.id === workspaceId);
  if (!workspace) return false;

  if (!workspace.children) {
    workspace.children = [];
  }
  
  workspace.children.push(child);
  await this.save();
  return true;
};

userSchema.methods.findWorkspaceById = function(
  this: IUser & IUserMethods,
  workspaceId: string,
  workspaces: IWorkspace[] = this.workspaces
): IWorkspace | null {
  for (const workspace of workspaces) {
    if (workspace.id === workspaceId) return workspace;
    
    if (workspace.children?.length) {
      const found = this.findWorkspaceById(workspaceId, workspace.children);
      if (found) return found;
    }
  }
  return null;
};

// Add missing mongoose import for Model
import { Model } from 'mongoose';

const User = mongoose.model<IUser, UserModel>("User", userSchema);
export default User;