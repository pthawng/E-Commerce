"use strict";
/**
 * Common Constants
 * Re-export từ config để backward compatibility
 * @deprecated Sử dụng từ @shared/config thay vì constants
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_LIMIT = exports.DEFAULT_LIMIT = exports.DEFAULT_PAGE = void 0;
// Re-export pagination
exports.DEFAULT_PAGE = 1;
exports.DEFAULT_LIMIT = 20;
exports.MAX_LIMIT = 100;
