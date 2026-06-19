'use client';
import React from 'react';
import BillingMain from '@/app/components/admin/BillingMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <BillingMain />
    </AdminPageShell>
  );
};

export default Page;
