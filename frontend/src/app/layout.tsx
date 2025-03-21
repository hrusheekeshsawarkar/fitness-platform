import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProviderWrapper } from "@/components/providers/AuthProviderWrapper";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Header } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Run2Rejuvenate",
  description: "A platform for fitness events and competitions",
  icons: {
    icon: '/r2r_logo.jpg',
    shortcut: '/r2r_logo.jpg',
    apple: '/r2r_logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProviderWrapper>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
          </AuthProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
