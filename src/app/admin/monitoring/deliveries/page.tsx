'use client';
import React from 'react';
import MonitoringDeliveriesMain from '@/app/components/admin/monitoring/MonitoringDeliveriesMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <MonitoringDeliveriesMain />
    </AdminPageShell>
  );
};

export default Page;
