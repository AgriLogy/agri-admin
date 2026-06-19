'use client';
import React from 'react';
import RecordsNotificationsMain from '@/app/components/admin/records/RecordsNotificationsMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <RecordsNotificationsMain />
    </AdminPageShell>
  );
};

export default Page;
