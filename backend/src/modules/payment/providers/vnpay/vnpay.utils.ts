import * as crypto from 'crypto';
import * as querystring from 'querystring';

/**
 * Sort object keys alphabetically
 * VNPAY requires parameters to be sorted before hashing
 */
export function sortObject<T extends Record<string, any>>(obj: T): T {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort();

    keys.forEach((key) => {
        sorted[key] = obj[key];
    });

    return sorted as T;
}

/**
 * Generate VNPAY secure hash (HMAC SHA512)
 * @param data - Object containing payment parameters
 * @param secretKey - VNPAY hash secret
 * @returns Secure hash string
 */
export function generateVNPayHash(
    data: Record<string, any>,
    secretKey: string,
): string {
    // Remove hash field if exists
    const { vnp_SecureHash, vnp_SecureHashType, ...signData } = data;

    // Sort parameters
    const sortedData = sortObject(signData);

    // Create query string
    const signDataString = querystring.stringify(sortedData);

    // Generate HMAC SHA512
    const hmac = crypto.createHmac('sha512', secretKey);
    const hash = hmac.update(Buffer.from(signDataString, 'utf-8')).digest('hex');

    return hash;
}

/**
 * Verify VNPAY callback signature
 * @param data - Callback data from VNPAY
 * @param secretKey - VNPAY hash secret
 * @returns True if signature is valid
 */
export function verifyVNPaySignature(
    data: Record<string, any>,
    secretKey: string,
): boolean {
    const receivedHash = data.vnp_SecureHash;

    if (!receivedHash) {
        return false;
    }

    const calculatedHash = generateVNPayHash(data, secretKey);

    return receivedHash === calculatedHash;
}

/**
 * Format date for VNPAY API (yyyyMMddHHmmss)
 * @param date - Date object
 * @returns Formatted date string
 */
export function formatVNPayDate(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Generate VNPAY transaction reference
 * Format: yyyyMMddHHmmss
 */
export function generateVNPayTxnRef(orderId: string): string {
    const timestamp = Date.now().toString();
    // VNPAY txnRef max length is 100 characters
    return `${orderId}_${timestamp}`.substring(0, 100);
}

/**
 * Build VNPAY payment URL
 * @param baseUrl - VNPAY payment gateway URL
 * @param params - Payment parameters
 * @returns Complete payment URL
 */
export function buildVNPayUrl(
    baseUrl: string,
    params: Record<string, any>,
): string {
    const sortedParams = sortObject(params);
    const queryString = querystring.stringify(sortedParams);
    return `${baseUrl}?${queryString}`;
}
