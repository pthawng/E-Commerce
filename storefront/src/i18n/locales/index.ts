import enCommon from './en/common';
import enShop from './en/shop';
import enAuth from './en/auth';
import enCheckout from './en/checkout';
import enHome from './en/home';
import enCart from './en/cart';
import enAccount from './en/account';

import viCommon from './vi/common';
import viShop from './vi/shop';
import viAuth from './vi/auth';
import viCheckout from './vi/checkout';
import viHome from './vi/home';
import viCart from './vi/cart';
import viAccount from './vi/account';

import zhCommon from './zh/common';
import zhShop from './zh/shop';
import zhAuth from './zh/auth';
import zhCheckout from './zh/checkout';
import zhHome from './zh/home';
import zhCart from './zh/cart';
import zhAccount from './zh/account';

export const locales = {
    en: {
        common: enCommon,
        shop: enShop,
        auth: enAuth,
        checkout: enCheckout,
        home: enHome,
        cart: enCart,
        account: enAccount,
    },
    vi: {
        common: viCommon,
        shop: viShop,
        auth: viAuth,
        checkout: viCheckout,
        home: viHome,
        cart: viCart,
        account: viAccount,
    },
    zh: {
        common: zhCommon,
        shop: zhShop,
        auth: zhAuth,
        checkout: zhCheckout,
        home: zhHome,
        cart: zhCart,
        account: zhAccount,
    },
};
