"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionAction = exports.PermissionModule = void 0;
/**
 * Permission Module Enum
 * Module phân quyền
 */
var PermissionModule;
(function (PermissionModule) {
    PermissionModule["USER"] = "USER";
    PermissionModule["PRODUCT"] = "PRODUCT";
    PermissionModule["ORDER"] = "ORDER";
    PermissionModule["DISCOUNT"] = "DISCOUNT";
    PermissionModule["CMS"] = "CMS";
    PermissionModule["SYSTEM"] = "SYSTEM";
})(PermissionModule || (exports.PermissionModule = PermissionModule = {}));
/**
 * Permission Action Enum
 * Hành động phân quyền
 */
var PermissionAction;
(function (PermissionAction) {
    PermissionAction["READ"] = "READ";
    PermissionAction["CREATE"] = "CREATE";
    PermissionAction["UPDATE"] = "UPDATE";
    PermissionAction["DELETE"] = "DELETE";
    PermissionAction["MANAGE"] = "MANAGE";
})(PermissionAction || (exports.PermissionAction = PermissionAction = {}));
