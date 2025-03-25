"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const navLinkClasses = (path: string) => 
    cn("transition-colors hover:text-primary px-2 py-1 rounded-md", 
      isActive(path) 
        ? "font-medium text-primary bg-primary/10" 
        : "text-muted-foreground");

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b relative z-50">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/welcome" className="flex items-center">
            <Image 
              src="/r2r_logo.jpg" 
              alt="Run2Rejuvenate Logo" 
              width={40} 
              height={40} 
              className="rounded-md"
            />
          </Link>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/welcome" className={navLinkClasses('/welcome')}>Welcome</Link>
            <Link href="/aboutus" className={navLinkClasses('/aboutus')}>About Us</Link>
            <Link href="/well-wishers" className={navLinkClasses('/well-wishers')}>Our Well Wishers</Link>
            <Link href="/stories" className={navLinkClasses('/stories')}>Our Stories</Link>
            <Link href="/articles" className={navLinkClasses('/articles')}>Articles</Link>
            <Link href="/events" className={navLinkClasses('/events')}>Events for You</Link>
            <Link href="/memories" className={navLinkClasses('/memories')}>Memories</Link>
            {user && <Link href="/my-events" className={navLinkClasses('/my-events')}>My Events</Link>}
            {user?.customClaims?.admin && (
              <>
                <Link href="/admin/events" className={cn(navLinkClasses('/admin/events'), "text-blue-600")}>
                  Admin Dashboard
                </Link>
                <Link href="/admin/events/create" className={cn(navLinkClasses('/admin/events/create'), "text-blue-600")}>
                  Create Event
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div>
                  {user.profile?.bib_number ? (
                    <Tooltip content={`BIB: ${user.profile.bib_number}`}>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL || ""} alt={user.email || ""} />
                          <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </Tooltip>
                  ) : (
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || ""} alt={user.email || ""} />
                        <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                    {user.profile?.bib_number && (
                      <p className="text-xs leading-none text-green-600">BIB: {user.profile.bib_number}</p>
                    )}
                    {user.customClaims?.admin && (
                      <p className="text-xs leading-none text-blue-600">Administrator</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem asChild>
                  <Link href="/profile" className="w-full cursor-pointer">
                    My Profile
                  </Link>
                </DropdownMenuItem> */}
                <DropdownMenuItem onClick={() => signOut()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/auth/register">
                <Button variant="secondary">Join Us</Button>
              </Link>
              <Link href="/auth/login">
                <Button>Sign In</Button>
              </Link>
            </div>
          )}
          
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-background z-40" onClick={closeMobileMenu}>
          <div 
            className="h-screen w-full flex flex-col justify-center p-6" 
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <X size={24} />
            </Button>
            
            <nav className="flex flex-col items-center space-y-6">
              <Link 
                href="/welcome" 
                className={cn("text-lg py-2 px-4", isActive('/welcome') ? "font-medium text-primary" : "")}
                onClick={closeMobileMenu}
              >
                Welcome
              </Link>
              <Link 
                href="/aboutus" 
                className={cn("text-lg py-2 px-4", isActive('/aboutus') ? "font-medium text-primary" : "")}
                onClick={closeMobileMenu}
              >
                About Us
              </Link>
              <Link 
                href="/well-wishers" 
                className={cn("text-lg py-2 px-4", isActive('/well-wishers') ? "font-medium text-primary" : "")}
                onClick={closeMobileMenu}
              >
                Our Well Wishers
              </Link>
              <Link 
                href="/stories" 
                className={cn("text-lg py-2 px-4", isActive('/stories') ? "font-medium text-primary" : "")}
                onClick={closeMobileMenu}
              >
                Our Stories
              </Link>
              <Link 
                href="/articles" 
                className={cn("text-lg py-2 px-4", isActive('/articles') ? "font-medium text-primary" : "")}
                onClick={closeMobileMenu}
              >
                Articles
              </Link>
              <Link 
                href="/events" 
                className={cn("text-lg py-2 px-4", isActive('/events') ? "font-medium text-primary" : "")}
                onClick={closeMobileMenu}
              >
                Events for You
              </Link>
              <Link 
                href="/memories" 
                className={cn("text-lg py-2 px-4", isActive('/memories') ? "font-medium text-primary" : "")}
                onClick={closeMobileMenu}
              >
                Memories
              </Link>
              {user && (
                <Link 
                  href="/my-events" 
                  className={cn("text-lg py-2 px-4", isActive('/my-events') ? "font-medium text-primary" : "")}
                  onClick={closeMobileMenu}
                >
                  My Events
                </Link>
              )}
              {user?.customClaims?.admin && (
                <>
                  <Link 
                    href="/admin/events" 
                    className={cn("text-lg py-2 px-4 text-blue-600", isActive('/admin/events') ? "font-medium" : "")}
                    onClick={closeMobileMenu}
                  >
                    Admin Dashboard
                  </Link>
                  <Link 
                    href="/admin/events/create" 
                    className={cn("text-lg py-2 px-4 text-blue-600", isActive('/admin/events/create') ? "font-medium" : "")}
                    onClick={closeMobileMenu}
                  >
                    Create Event
                  </Link>
                </>
              )}
              {!user && (
                <>
                  <Link 
                    href="/auth/register" 
                    className="mt-6 w-full max-w-xs"
                    onClick={closeMobileMenu}
                  >
                    <Button variant="secondary" size="lg" className="w-full">Join Us</Button>
                  </Link>
                  <Link 
                    href="/auth/login" 
                    className="mt-2 w-full max-w-xs"
                    onClick={closeMobileMenu}
                  >
                    <Button size="lg" className="w-full">Sign In</Button>
                  </Link>
                </>
              )}
              
              <Button 
                variant="outline" 
                className="mt-8 w-full max-w-xs"
                onClick={closeMobileMenu}
              >
                Close Menu
              </Button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
} 