'use client';

import React, { useState } from 'react';
import { Box, Grid, GridItem } from '@chakra-ui/react';
import HeaderAdmin from '@/app/components/main/AdminHeader';
import AdminSidebar from '@/app/components/main/AdminSidebar';
import useColorModeStyles from '@/app/utils/useColorModeStyles';
import { AccessRefused } from '@/app/components/admin/_shared/AccessRefused';
import { startAccessGeneration, useAccessDenied } from '@/app/lib/accessDenied';
import { CurrentAdminProvider } from './CurrentAdminProvider';

export function AdminPageShell({ children }: { children: React.ReactNode }) {
  const { textColor, navBgColor } = useColorModeStyles();
  // New page view: forget a refusal from the previous page. Runs during the
  // first render, before the page's own effects send their requests.
  useState(startAccessGeneration);
  // A read on this page came back 403: say access was refused rather than
  // letting the page render its "no data" state.
  const accessDenied = useAccessDenied();

  return (
    <CurrentAdminProvider>
      <Grid
        templateAreas={{
          base: `"header" "main"`,
          md: `"header header" "nav main"`,
        }}
        gridTemplateRows={{ base: 'auto 1fr', md: '50px 1fr' }}
        gridTemplateColumns={{
          base: 'minmax(0, 1fr)',
          md: '50px minmax(0, 1fr)',
        }}
        w="100%"
        maxW="100%"
        minW={0}
        h="100vh"
        maxH="100dvh"
        overflow="hidden"
        gap={0.5}
        color={textColor}
        fontWeight="bold"
      >
        <GridItem
          area="header"
          bg={navBgColor}
          minW={0}
          maxW="100%"
          overflow="hidden"
        >
          <HeaderAdmin />
        </GridItem>
        <GridItem
          bg={navBgColor}
          area="nav"
          display={{ base: 'none', md: 'block' }}
          minW={0}
          overflow="hidden"
        >
          <AdminSidebar />
        </GridItem>
        <GridItem
          area="main"
          pl={{ base: 1, md: 2 }}
          pr={{ base: 1, md: 2 }}
          bg={navBgColor}
          minW={0}
          minH={0}
          maxW="100%"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          <Box
            flex="1"
            minH={0}
            minW={0}
            w="100%"
            maxW="100%"
            overflowY="auto"
            overflowX="hidden"
            sx={{ WebkitOverflowScrolling: 'touch' }}
          >
            {accessDenied ? <AccessRefused /> : children}
          </Box>
        </GridItem>
      </Grid>
    </CurrentAdminProvider>
  );
}
