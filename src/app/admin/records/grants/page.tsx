'use client';
import React from 'react';
import RecordsGrantsMain from '@/app/components/admin/records/RecordsGrantsMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <RecordsGrantsMain />
    </AdminPageShell>
  );
};

export default Page;
