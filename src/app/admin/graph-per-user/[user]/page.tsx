'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Params = { user: string };

const Page = ({ params }: { params: Promise<Params> }) => {
  const { user } = use(params);
  const router = useRouter();
  useEffect(() => {
    router.replace(`/admin/users/${encodeURIComponent(user)}?tab=graphs`);
  }, [user, router]);
  return null;
};

export default Page;
