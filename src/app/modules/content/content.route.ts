import express, { NextFunction, Request, Response } from 'express';
import { ContentController } from './content.controller';
import validateRequest from '../../middleware/validateRequest';
import { ContentValidation } from './content.validation';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import { getSingleFilePath } from '../../../shared/getFilePath';
import moveImagesVideosToS3 from '../../middleware/moveImagesVideosToS3';

const router = express.Router();


// user content routes
router.get('/', auth(USER_ROLES.ADMIN, USER_ROLES.USER), ContentController.getContents);

router.get('/:id', auth(USER_ROLES.ADMIN, USER_ROLES.USER), ContentController.getSingleContent);

router.put(
     '/:id',
     auth(USER_ROLES.USER),
     validateRequest(ContentValidation.updateContentZodSchema),
     ContentController.updateContent,
);
// admin content routes

router.post(
     '/',
     auth(USER_ROLES.ADMIN),
     fileUploadHandler(),
     async (req: Request, res: Response, next: NextFunction) => {
          try {
               // 🔹 Upload image/video files from local → S3
               const s3Uploads = await moveImagesVideosToS3(req.files);

               const video = Array.isArray(s3Uploads.video) ? s3Uploads.video[0].url : s3Uploads.video?.url;

               // merge request body
               const data = JSON.parse(req.body.data || '{}');

               req.body = video ? { videoUrl: video, ...data } : { ...data };

               next();
          } catch (error) {
               next(error);
          }
     },
     validateRequest(ContentValidation.createContentZodSchema),
     ContentController.createContent,
);
router.patch(
     '/:id',
     auth(USER_ROLES.ADMIN),
     fileUploadHandler(),
     async (req: Request, res: Response, next: NextFunction) => {
          try {
               // 🔹 Upload image/video files from local → S3
               const s3Uploads = await moveImagesVideosToS3(req.files);

               const video = Array.isArray(s3Uploads.video) ? s3Uploads.video[0].url : s3Uploads.video?.url;

               // merge request body
               const data = JSON.parse(req.body.data || '{}');

               req.body = video ? { videoUrl: video, ...data } : { ...data };

               next();
          } catch (error) {
               next(error);
          }
     },
     validateRequest(ContentValidation.updateContentZodSchema),
     ContentController.updateContent,
);
router.delete('/:id',
      auth(USER_ROLES.ADMIN),
 ContentController.deleteContent);

export const ContentRouter = router;
