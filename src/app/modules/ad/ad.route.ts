import express, { NextFunction, Request, Response } from 'express';
import { AdController } from './ad.controller';
import validateRequest from '../../middleware/validateRequest';
import { AdValidation } from './ad.validation';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import moveImagesVideosToS3 from '../../middleware/moveImagesVideosToS3';

const router = express.Router();

// admin ad routes
router.post(
     '/',
     auth(USER_ROLES.ADMIN),
     fileUploadHandler(),
     async (req: Request, res: Response, next: NextFunction) => {
          try {
               let url = null;
               // 🔹 Upload image/video files from local → S3
               const s3Uploads = await moveImagesVideosToS3(req.files);
               const image = Array.isArray(s3Uploads.image) ? s3Uploads.image[0].url : s3Uploads.image?.url;
               if (image) {
                    url = image;
               }

               const video = Array.isArray(s3Uploads.video) ? s3Uploads.video[0].url : s3Uploads.video?.url;
               if (video) {
                    url = video;
               }
               // merge request body
               const data = JSON.parse(req.body.data || '{}');

               req.body = url ? { url, ...data } : { ...data };

               next();
          } catch (error) {
               next(error);
          }
     },
     validateRequest(AdValidation.createAdZodSchema),
     AdController.createAd,
);

router.get('/', auth(USER_ROLES.ADMIN), AdController.getAds);

router.patch(
     '/:id',
     auth(USER_ROLES.ADMIN),
     fileUploadHandler(),
     async (req: Request, res: Response, next: NextFunction) => {
          try {
               let url = null;
               // 🔹 Upload image/video files from local → S3
               const s3Uploads = await moveImagesVideosToS3(req.files);
               const image = Array.isArray(s3Uploads.image) ? s3Uploads.image[0].url : s3Uploads.image?.url;
               if (image) {
                    url = image;
               }

               const video = Array.isArray(s3Uploads.video) ? s3Uploads.video[0].url : s3Uploads.video?.url;
               if (video) {
                    url = video;
               }
               // merge request body
               const data = JSON.parse(req.body.data || '{}');

               req.body = url ? { url, ...data } : { ...data };

               next();
          } catch (error) {
               next(error);
          }
     },
     validateRequest(AdValidation.updateAdZodSchema),
     AdController.updateAd,
);

router.delete('/:id', auth(USER_ROLES.ADMIN), AdController.deleteAd);



// user ad routes
router.get('/random-ads', auth(USER_ROLES.USER), AdController.getSingleAd);


export const AdRouter = router;
