import { Schema, model, Document } from 'mongoose';
import { User } from '@/common/interfaces';

interface IUser extends User, Document { }

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  is_admin: { type: Boolean, required: true },
}, { collection: 'users' });

const UserModel = model<IUser>('User', userSchema);

export default UserModel;