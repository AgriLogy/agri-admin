'use client';
import React from 'react';
import DeviceFleetHealthMain from '@/app/components/admin/DeviceFleetHealthMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <DeviceFleetHealthMain />
    </AdminPageShell>
  );
};

export default Page;
