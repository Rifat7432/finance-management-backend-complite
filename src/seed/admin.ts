import { IUser } from '../app/modules/user/user.interface';
import { User } from '../app/modules/user/user.model';
import config from '../config';
import { USER_ROLES } from '../enums/user';

export const seedAdmin = async () => {
     try {
          // Check if admin already exists
          const existingAdmin = await User.findOne({ role: USER_ROLES.ADMIN, email: config.admin.email });
          if (existingAdmin) {
               console.log('Admin already exists');
               return;
          }

          // Prepare payload
          const payload: Partial<IUser> = {
               name: 'Admin',
               email: config.admin.email,
               password: config.admin.password, // will be hashed inside createUserToDB if you handle hashing there
               role: USER_ROLES.ADMIN, // set role to admin
               image: 'https://example.com/admin-image.png',
          };

          await User.create(payload);
     } catch (error) {
          console.error('Error seeding admin:', error);
     }
};
