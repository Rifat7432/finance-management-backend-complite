import { StatusCodes } from 'http-status-codes';
import { Ad } from './ad.model';
import AppError from '../../../errors/AppError';
import { IAd } from './ad.interface';
import { deleteFileFromSpaces } from '../../middleware/uploadFileToSpaces';
import QueryBuilder from '../../builder/QueryBuilder';
import { getCurrentUTC, toUTC } from '../../../utils/dateTimeHelper';

const createAdToDB = async (payload: IAd): Promise<IAd> => {
     const { endDate, startDate, ...rest } = payload;
     const utcStartDate = toUTC(startDate as Date);
     const utcEndDate = toUTC(endDate as Date);
     const newAd = await Ad.create({ ...rest, endDate: utcEndDate, startDate: utcStartDate });
     if (!newAd) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create ad');
     }
     return newAd;
};

const getAdsFromDB = async (query: any) => {
     const ads = new QueryBuilder(Ad.find(), { ...query, isDeleted: false }).filter().sort().paginate().fields();
     const result = await ads.modelQuery;
     const meta = await ads.countTotal();

     return { meta, result };
};

const getSingleAdFromDB = async (query: any = {}): Promise<IAd | null> => {
     const now = getCurrentUTC();

     const pipeline = [
          {
               $addFields: {
                    startDateObj: { $toDate: '$startDate' },
                    endDateObj: { $toDate: '$endDate' },
               },
          },
          {
               $match: {
                    ...(query.category ? { category: query.category } : {}), // merge optional filters (like category)
                    isDeleted: false,
                    startDateObj: { $lte: now },
                    endDateObj: { $gte: now },
               },
          },
          { $sample: { size: 1 } }, // pick one random ad
     ];

     const result = await Ad.aggregate(pipeline);
     return result.length > 0 ? result[0] : null;
};

const updateAdToDB = async (id: string, payload: Partial<IAd>): Promise<IAd | null> => {
     const ad = await Ad.findById(id);
     if (!ad || ad.isDeleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Ad not found or deleted');
     }
     if (payload.url) {
          deleteFileFromSpaces(ad.url);
     }
     const updated = await Ad.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update ad');
     }
     return updated;
};

const deleteAdFromDB = async (id: string): Promise<boolean> => {
     const ad = await Ad.findById(id);
     if (!ad || ad.isDeleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Ad not found or deleted');
     }
     const deleted = await Ad.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Ad not found');
     }
     if (ad.url) {
          deleteFileFromSpaces(ad.url);
     }
     return true;
};

export const AdService = {
     createAdToDB,
     getAdsFromDB,
     getSingleAdFromDB,
     updateAdToDB,
     deleteAdFromDB,
};
