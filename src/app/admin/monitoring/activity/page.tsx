'use client';
import React from 'react';
import MonitoringActivityMain from '@/app/components/admin/monitoring/MonitoringActivityMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <MonitoringActivityMain />
    </AdminPageShell>
  );
};

export default Page;
