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
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_codes_1 = require("http-status-codes");
class QueryBuilder {
    constructor(modelQuery, query) {
        this.modelQuery = modelQuery;
        this.query = query;
    }
    search(searchableFields) {
        var _a;
        const searchTerm = (_a = this.query) === null || _a === void 0 ? void 0 : _a.searchTerm;
        console.log(searchTerm);
        if (searchTerm && searchTerm !== "" && searchableFields.length > 0) {
            this.modelQuery = this.modelQuery.find({
                $or: searchableFields.map((field) => ({
                    [field]: { $regex: searchTerm, $options: 'i' },
                })),
            });
        }
        return this;
    }
    filter() {
        const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
        const queryObj = Object.assign({}, this.query);
        excludeFields.forEach((el) => delete queryObj[el]);
        this.modelQuery = this.modelQuery.find(queryObj);
        return this;
    }
    sort() {
        var _a, _b, _c;
        const sort = ((_c = (_b = (_a = this.query) === null || _a === void 0 ? void 0 : _a.sort) === null || _b === void 0 ? void 0 : _b.split(',')) === null || _c === void 0 ? void 0 : _c.join(' ')) || '-createdAt';
        this.modelQuery = this.modelQuery.sort(sort);
        return this;
    }
    paginate(defaultLimit = 10) {
        var _a, _b;
        const page = Number((_a = this.query) === null || _a === void 0 ? void 0 : _a.page) || 1;
        const limit = Number((_b = this.query) === null || _b === void 0 ? void 0 : _b.limit) || defaultLimit;
        const skip = (page - 1) * limit;
        this.modelQuery = this.modelQuery.skip(skip).limit(limit).sort();
        return this;
    }
    fields() {
        var _a, _b, _c;
        const fields = ((_c = (_b = (_a = this.query) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b.split(',')) === null || _c === void 0 ? void 0 : _c.join(' ')) || '-__v';
        this.modelQuery = this.modelQuery.select(fields);
        return this;
    }
    priceRange() {
        var _a, _b;
        const priceFilter = {};
        const minPrice = (_a = this.query) === null || _a === void 0 ? void 0 : _a.minPrice;
        const maxPrice = (_b = this.query) === null || _b === void 0 ? void 0 : _b.maxPrice;
        if (minPrice !== undefined)
            priceFilter.$gte = minPrice;
        if (maxPrice !== undefined)
            priceFilter.$lte = maxPrice;
        if (minPrice !== undefined || maxPrice !== undefined) {
            this.modelQuery = this.modelQuery.find({
                price: priceFilter,
            });
        }
        return this;
    }
    countTotal() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const totalQueries = this.modelQuery.getFilter();
                const total = yield this.modelQuery.model.countDocuments(totalQueries);
                const page = Number((_a = this.query) === null || _a === void 0 ? void 0 : _a.page) || 1;
                const limit = Number((_b = this.query) === null || _b === void 0 ? void 0 : _b.limit) || 10;
                const totalPage = Math.ceil(total / limit);
                return { page, limit, total, totalPage };
            }
            catch (error) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE, error);
            }
        });
    }
}
exports.default = QueryBuilder;
