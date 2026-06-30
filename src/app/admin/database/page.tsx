'use client';

import DatabaseMain from '@/app/components/admin/database/DatabaseMain';
import { AdminPageShell } from '@/app/components/layout/AdminPageShell';

const Page = () => (
  <AdminPageShell>
    <DatabaseMain />
  </AdminPageShell>
);

export default Page;
