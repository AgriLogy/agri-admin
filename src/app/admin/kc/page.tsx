'use client';
import React from 'react';
import KcMain from '@/app/components/admin/KcMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <KcMain />
    </AdminPageShell>
  );
};

export default Page;
