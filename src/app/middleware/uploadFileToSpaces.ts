import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import fs from 'fs';
import path from 'path';
import config from '../../config';

// 🟦 DigitalOcean Spaces client setup
const spacesClient = new S3Client({
     region: 'us-east-1',
     endpoint: `https://${config.spaces.SPACES_ENDPOINT}`,
     credentials: {
          accessKeyId: config.spaces.SPACES_KEY!,
          secretAccessKey: config.spaces.SPACES_SECRET!,
     },
});

// 🔹 Upload local file → DigitalOcean Spaces → always remove local temp file
const uploadFileToSpaces = async (localFilePath: string) => {
     if (!fs.existsSync(localFilePath)) {
          throw new Error(`Local file not found: ${localFilePath}`);
     }

     const fileStream = fs.createReadStream(localFilePath);

     const ext = path.extname(localFilePath) || '';
     const contentType = mime.lookup(ext) || 'application/octet-stream';

     let folderName = 'others';
     if (contentType.startsWith('image/')) {
          folderName = 'image';
     } else if (contentType.startsWith('video/')) {
          folderName = 'video';
     }

     const generatedId = uuidv4();
     const fileName = `${folderName}/${generatedId}${ext || '.bin'}`;
     try {
          const command = new PutObjectCommand({
               Bucket: config.spaces.SPACES_BUCKET!,
               Key: fileName,
               Body: fileStream,
               ContentType: contentType,
               ACL: 'public-read', // Spaces files are private by default unless made public
          });

          await spacesClient.send(command);

          console.log(`✅ Uploaded to Spaces: ${fileName}`);

          const fileUrl = `https://${config.spaces.SPACES_BUCKET}.${config.spaces.SPACES_ENDPOINT}/${fileName}`;

          return {
               id: generatedId,
               type: folderName,
               url: fileUrl,
          };
     } catch (error) {
          console.error('❌ Error uploading to Spaces:', error);
          throw error;
     } finally {
          try {
               fs.unlinkSync(localFilePath);
               console.log(`🧹 Temp file deleted: ${localFilePath}`);
          } catch (err) {
               console.warn(`⚠️ Failed to delete temp file (${localFilePath}):`, err);
          }
     }
};

// 🔹 Delete file from DigitalOcean Spaces by URL
const deleteFileFromSpaces = async (fileUrl: string) => {
     try {
          const url = new URL(fileUrl);

          const bucketName = url.hostname.split('.')[0]; // e.g., mybucket.nyc3.digitaloceanspaces.com
          const key = decodeURIComponent(url.pathname.slice(1));

          const command = new DeleteObjectCommand({
               Bucket: bucketName,
               Key: key,
          });

          await spacesClient.send(command);

          console.log(`✅ Deleted from Spaces: ${key}`);
          return { success: true, key };
     } catch (error) {
          console.error('❌ Error deleting Spaces file:', error);
          return { success: false, error };
     }
};

export { uploadFileToSpaces, deleteFileFromSpaces };
