import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProfileLayout } from '@/features/profile/components/ProfileLayout';
import { Outlet } from 'react-router-dom';

/**
 * Account Page
 * URL: /account
 * Purpose: Allows users to view and manage their personal information and account settings.
 */
const AccountPage: React.FC = () => {
  return (
    <Layout forceHeaderOpaque={true}>
      <ProfileLayout>
        <Outlet />
      </ProfileLayout>
    </Layout>
  );
};


export default AccountPage;
