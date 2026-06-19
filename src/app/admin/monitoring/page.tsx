'use client';
import React from 'react';
import MonitoringOverviewMain from '@/app/components/admin/monitoring/MonitoringOverviewMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <MonitoringOverviewMain />
    </AdminPageShell>
  );
};

export default Page;
