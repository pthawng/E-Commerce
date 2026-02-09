import { message } from 'antd';
import { AxiosError } from 'axios';

// --- Global Toast Spam Protection ---
let errorShown = false;

export const showErrorOnce = (msg: string) => {
    if (errorShown) return;
    errorShown = true;
    message.error(msg);
    setTimeout(() => {
        errorShown = false;
    }, 2000);
};

// --- Standardized API Error Handler ---
export const handleApiError = (error: AxiosError) => {
    const status = error.response?.status;

    // 401 is handled by the refresh token logic in the interceptor, so we skip it here
    if (status === 401) return;

    if (status === 403) {
        showErrorOnce('You do not have permission to perform this action.');
        return;
    }

    if (status && status >= 500) {
        showErrorOnce('Internal Server Error. Please try again later.');
        return;
    }

    if (error.code === 'ERR_NETWORK') {
        showErrorOnce('Network Error. Please check your connection.');
        return;
    }

    // Default error message
    // @ts-ignore - responding to arbitrary backend error structure if needed
    const backendMessage = error.response?.data?.message;
    showErrorOnce(backendMessage || error.message || 'Something went wrong');
};
