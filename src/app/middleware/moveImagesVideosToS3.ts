import {  uploadFileToSpaces } from "./uploadFileToSpaces";


const moveImagesVideosToS3 = async (files: any) => {
     const s3Paths: Record<string, any> = {};

     for (const field of ['image', 'video']) {
          const fileField = files?.[field];
          if (fileField && Array.isArray(fileField) && fileField.length > 0) {
               if (fileField.length === 1) {
                    const uploaded = await uploadFileToSpaces(fileField[0].path);
                    s3Paths[field] = uploaded;
               } else {
                    s3Paths[field] = await Promise.all(fileField.map((f) => uploadFileToSpaces(f.path)));
               }
          }
     }

     return s3Paths;
};
export default moveImagesVideosToS3;
