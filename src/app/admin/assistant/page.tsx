'use client';
import React from 'react';
import AssistantMain from '@/app/components/admin/AssistantMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <AssistantMain />
    </AdminPageShell>
  );
};

export default Page;
