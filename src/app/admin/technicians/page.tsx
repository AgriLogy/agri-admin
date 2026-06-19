'use client';
import React from 'react';
import TechniciansMain from '@/app/components/admin/TechniciansMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <TechniciansMain />
    </AdminPageShell>
  );
};

export default Page;
