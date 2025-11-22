"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFileFromSpaces = exports.uploadFileToSpaces = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const mime_types_1 = __importDefault(require("mime-types"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../../config"));
// 🟦 DigitalOcean Spaces client setup
const spacesClient = new client_s3_1.S3Client({
    region: 'us-east-1',
    endpoint: `https://${config_1.default.spaces.SPACES_ENDPOINT}`,
    credentials: {
        accessKeyId: config_1.default.spaces.SPACES_KEY,
        secretAccessKey: config_1.default.spaces.SPACES_SECRET,
    },
});
// 🔹 Upload local file → DigitalOcean Spaces → always remove local temp file
const uploadFileToSpaces = (localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    if (!fs_1.default.existsSync(localFilePath)) {
        throw new Error(`Local file not found: ${localFilePath}`);
    }
    const fileStream = fs_1.default.createReadStream(localFilePath);
    const ext = path_1.default.extname(localFilePath) || '';
    const contentType = mime_types_1.default.lookup(ext) || 'application/octet-stream';
    let folderName = 'others';
    if (contentType.startsWith('image/')) {
        folderName = 'image';
    }
    else if (contentType.startsWith('video/')) {
        folderName = 'video';
    }
    const generatedId = (0, uuid_1.v4)();
    const fileName = `${folderName}/${generatedId}${ext || '.bin'}`;
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: config_1.default.spaces.SPACES_BUCKET,
            Key: fileName,
            Body: fileStream,
            ContentType: contentType,
            ACL: 'public-read', // Spaces files are private by default unless made public
        });
        yield spacesClient.send(command);
        console.log(`✅ Uploaded to Spaces: ${fileName}`);
        const fileUrl = `https://${config_1.default.spaces.SPACES_BUCKET}.${config_1.default.spaces.SPACES_ENDPOINT}/${fileName}`;
        return {
            id: generatedId,
            type: folderName,
            url: fileUrl,
        };
    }
    catch (error) {
        console.error('❌ Error uploading to Spaces:', error);
        throw error;
    }
    finally {
        try {
            fs_1.default.unlinkSync(localFilePath);
            console.log(`🧹 Temp file deleted: ${localFilePath}`);
        }
        catch (err) {
            console.warn(`⚠️ Failed to delete temp file (${localFilePath}):`, err);
        }
    }
});
exports.uploadFileToSpaces = uploadFileToSpaces;
// 🔹 Delete file from DigitalOcean Spaces by URL
const deleteFileFromSpaces = (fileUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = new URL(fileUrl);
        const bucketName = url.hostname.split('.')[0]; // e.g., mybucket.nyc3.digitaloceanspaces.com
        const key = decodeURIComponent(url.pathname.slice(1));
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        yield spacesClient.send(command);
        console.log(`✅ Deleted from Spaces: ${key}`);
        return { success: true, key };
    }
    catch (error) {
        console.error('❌ Error deleting Spaces file:', error);
        return { success: false, error };
    }
});
exports.deleteFileFromSpaces = deleteFileFromSpaces;
