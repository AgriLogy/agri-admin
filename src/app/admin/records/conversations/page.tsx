'use client';
import React from 'react';
import RecordsConversationsMain from '@/app/components/admin/records/RecordsConversationsMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <RecordsConversationsMain />
    </AdminPageShell>
  );
};

export default Page;
