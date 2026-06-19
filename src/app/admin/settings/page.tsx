'use client';
import React from 'react';
import SettingsMain from '@/app/components/admin/SettingsMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <SettingsMain />
    </AdminPageShell>
  );
};

export default Page;
