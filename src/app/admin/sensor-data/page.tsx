'use client';
import React from 'react';
import SensorDataExplorerMain from '@/app/components/admin/SensorDataExplorerMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <SensorDataExplorerMain />
    </AdminPageShell>
  );
};

export default Page;
