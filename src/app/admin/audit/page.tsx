'use client';
import React from 'react';
import AuditMain from '@/app/components/admin/AuditMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <AuditMain />
    </AdminPageShell>
  );
};

export default Page;
