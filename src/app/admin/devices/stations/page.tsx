'use client';
import React from 'react';
import StationExposureMain from '@/app/components/admin/StationExposureMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <StationExposureMain />
    </AdminPageShell>
  );
};

export default Page;
