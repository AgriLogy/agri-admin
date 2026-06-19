'use client';
import React from 'react';
import MonitoringTasksMain from '@/app/components/admin/monitoring/MonitoringTasksMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <MonitoringTasksMain />
    </AdminPageShell>
  );
};

export default Page;
