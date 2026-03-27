import React from 'react';
import ProfileFeature from '@/features/profile';
import { Layout } from '@/components/layout/Layout';

/**
 * Account Page
 * URL: /account
 * Purpose: Allows users to view and manage their personal information and account settings.
 */
const AccountPage: React.FC = () => {
  return (
    <Layout forceHeaderOpaque={true}>
      <ProfileFeature />
    </Layout>
  );
};


export default AccountPage;
