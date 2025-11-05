import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import auth from '../../middleware/auth';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import validateRequest from '../../middleware/validateRequest';
import moveImagesVideosToS3 from '../../middleware/moveImagesVideosToS3';
const router = express.Router();


// admin routes
router.route('/').get(auth(USER_ROLES.ADMIN), UserController.getAllUsers);
router.route('/block/:id').delete(auth(USER_ROLES.ADMIN), UserController.blockUser);




// user and admin routes
router
     .route('/profile')
     .get(auth(USER_ROLES.ADMIN, USER_ROLES.USER), UserController.getUserProfile)
     .patch(
          auth(USER_ROLES.ADMIN, USER_ROLES.USER),
          fileUploadHandler(),
          async (req: Request, res: Response, next: NextFunction) => {
               try {
                    // 🔹 Upload image/video files from local → S3
                    const s3Uploads = await moveImagesVideosToS3(req.files);

                    // pick S3 URL (single or first item if multiple)
                    const image = Array.isArray(s3Uploads.image) ? s3Uploads.image[0].url : s3Uploads.image?.url;

                    // merge request body
                    const data = JSON.parse(req.body.data || '{}');
                    req.body = image ? { image, ...data } : { ...data };

                    next();
               } catch (error) {
                    next(error);
               }
          },
          validateRequest(UserValidation.updateUserZodSchema),
          UserController.updateProfile,
     );
     // user routes
router.route('/').post(
     fileUploadHandler(),
     async (req: Request, res: Response, next: NextFunction) => {
          try {
               // 🔹 Upload image/video files from local → S3
               const s3Uploads = await moveImagesVideosToS3(req.files);

               // pick S3 URL (single or first item if multiple)
               const image = Array.isArray(s3Uploads.image) ? s3Uploads.image[0].url : s3Uploads.image?.url;

               // merge request body
               const data = JSON.parse(req.body.data || '{}');
               req.body = image ? { image, ...data } : { ...data };

               next();
          } catch (error) {
               next(error);
          }
     },
     validateRequest(UserValidation.createUserZodSchema),
     UserController.createUser,
);
router.post('/google', validateRequest(UserValidation.googleAuthZodSchema), UserController.createUserByGoogle);
router.post('/apple', validateRequest(UserValidation.appleAuthZodSchema), UserController.createUserByApple);
router.delete('/delete', auth(USER_ROLES.USER), UserController.deleteProfile);
router.route('/user/:id').get(auth(USER_ROLES.USER), UserController.getUser);

export const UserRouter = router;
