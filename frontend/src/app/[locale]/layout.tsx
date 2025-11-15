import { ReactNode } from "react";
import { hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/lib/i18n/routing';
import { setRequestLocale } from "next-intl/server";

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export default async function LocaleLayout({children, params}: Props) {
  // Ensure that the incoming `locale` is valid
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  
  return <>{children}</>; 
}



