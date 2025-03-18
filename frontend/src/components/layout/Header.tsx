"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            R2R
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/events">Events</Link>
            {user && <Link href="/my-events">My Events</Link>}
            {user?.customClaims?.admin && (
              <>
                <Link href="/admin/events" className="text-blue-600">
                  Admin Dashboard
                </Link>
                <Link href="/admin/events/create" className="text-blue-600">
                  Create Event
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ""} alt={user.email || ""} />
                    <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                    {user.customClaims?.admin && (
                      <p className="text-xs leading-none text-blue-600">Administrator</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
} 