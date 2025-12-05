/**
 * Auth Types
 * Types cho Authentication - dùng chung giữa BE và FE
 */
/**
 * Login Payload
 */
export interface LoginPayload {
    email?: string;
    phone?: string;
    password: string;
}
/**
 * Register Payload
 */
export interface RegisterPayload {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
}
/**
 * Auth Tokens
 */
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
/**
 * Auth Response (includes user + tokens)
 */
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        fullName?: string;
        phone?: string;
        isActive: boolean;
        isEmailVerified: boolean;
    };
    tokens: AuthTokens;
}
/**
 * Refresh Token Payload
 */
export interface RefreshTokenPayload {
    refreshToken: string;
}
/**
 * Change Password Payload
 */
export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}
/**
 * Forgot Password Payload
 */
export interface ForgotPasswordPayload {
    email: string;
}
/**
 * Reset Password Payload
 */
export interface ResetPasswordPayload {
    token: string;
    newPassword: string;
}
/**
 * Verify Email Payload
 */
export interface VerifyEmailPayload {
    token: string;
}
//# sourceMappingURL=auth.types.d.ts.map