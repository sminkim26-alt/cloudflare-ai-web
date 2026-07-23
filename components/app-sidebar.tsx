"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Cog, ImageIcon, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import LoadingIndicator from "@/components/loading-indicator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { db } from "@/lib/db";

const AppSidebar = () => {
  const { session_id } = useParams();
  const router = useRouter();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const pathname = usePathname();

  const sessions = useLiveQuery(() =>
    db.session.limit(100).reverse().sortBy("updatedAt"),
  );

  const handleDelete = async () => {
    await db.transaction("rw", db.session, db.message, async () => {
      await db.session.delete(sessionId);
      await db.message.where("sessionId").equals(sessionId).delete();
    });
    setDeleteConfirmOpen(false);
    router.push("/");
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/image"}>
                <Link href="/image">
                  <ImageIcon />
                  Image
                  <LoadingIndicator className="ml-auto" />
                </Link>
              </SidebarMenuButton>

              {pathname === "/image" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction>
                      <MoreHorizontal />
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start">
                    <DropdownMenuItem
                      onClick={() => {
                        setDeleteConfirmOpen(true);
                        setSessionId("image");
                      }}
                    >
                      <span className="text-destructive">Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="scrollbar">
          {sessions && sessions.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Recents</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sessions.map(({ id, name }) => (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton asChild isActive={session_id === id}>
                        <Link href={`/c/${id}`}>
                          {name}
                          <LoadingIndicator className="ml-auto" />
                        </Link>
                      </SidebarMenuButton>

                      {session_id === id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuAction>
                              <MoreHorizontal />
                            </SidebarMenuAction>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start">
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteConfirmOpen(true);
                                setSessionId(id);
                              }}
                            >
                              <span className="text-destructive">Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center">
              <Button size="icon" variant="ghost" className="size-8" disabled>
                <Cog />
              </Button>

              <Link href="/" className="ml-auto">
                <Button variant="ghost">
                  New Chat
                  <Plus />
                </Button>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this session?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AppSidebar;
