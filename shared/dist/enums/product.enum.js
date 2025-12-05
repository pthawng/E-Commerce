"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionType = exports.MediaType = void 0;
/**
 * Media Type Enum
 * Loại media cho sản phẩm
 */
var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "image";
    MediaType["VIDEO"] = "video";
    MediaType["MODEL_3D"] = "model_3d";
})(MediaType || (exports.MediaType = MediaType = {}));
/**
 * Inventory Action Type Enum
 * Loại hành động kho
 */
var ActionType;
(function (ActionType) {
    ActionType["IMPORT"] = "IMPORT";
    ActionType["SALE"] = "SALE";
    ActionType["RETURN"] = "RETURN";
    ActionType["TRANSFER_OUT"] = "TRANSFER_OUT";
    ActionType["TRANSFER_IN"] = "TRANSFER_IN";
    ActionType["ADJUSTMENT"] = "ADJUSTMENT";
})(ActionType || (exports.ActionType = ActionType = {}));
