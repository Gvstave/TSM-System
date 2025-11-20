'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarProvider,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard } from 'lucide-react';
import { Logo } from './logo';
import { usePathname } from 'next/navigation';
import { SidebarUserProfile } from './sidebar-user-profile';
import { Separator } from './ui/separator';

export function MainSidebar() {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/dashboard"
                isActive={pathname.startsWith('/dashboard')}
              >
                <LayoutDashboard />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <Separator />
        <SidebarFooter>
          <SidebarUserProfile />
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
