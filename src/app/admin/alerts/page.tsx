'use client';
import React from 'react';
import AlertsConsoleMain from '@/app/components/admin/AlertsConsoleMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <AlertsConsoleMain />
    </AdminPageShell>
  );
};

export default Page;
