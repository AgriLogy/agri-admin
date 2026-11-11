'use client';
import React from 'react';
import KnowledgeMain from '@/app/components/admin/KnowledgeMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => {
  return (
    <AdminPageShell>
      <KnowledgeMain />
    </AdminPageShell>
  );
};

export default Page;
