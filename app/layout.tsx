import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import AppSidebar from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Cloudflare AI Web",
  description: "Cloudflare AI Platform with one-click deployment.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const cookieStore = await cookies();
  // const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="scrollbar-thumb-border scrollbar-track-transparent">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster position="top-center" richColors />

          <SidebarProvider>
            <AppSidebar />

            <SidebarInset>
              <header className="h-16 flex items-center justify-between px-4 absolute w-full">
                <SidebarTrigger className="-ml-1 z-10" />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 500 64"
                  className="h-11"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="wvg1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                    <path
                      id="wvo1"
                      d="M36 18 C48 18, 56 26, 56 32 C56 38, 48 46, 36 46 C24 46, 16 38, 16 32 C16 26, 24 18, 36 18Z"
                      fill="none"
                    />
                  </defs>
                  <path
                    d="M36 4L40 28L64 32L40 36L36 60L32 36L8 32L32 28L36 4Z"
                    fill="url(#wvg1)"
                  />
                  <circle r="4" fill="#60a5fa">
                    <animateMotion dur="4s" repeatCount="indefinite">
                      <mpath href="#wvo1" />
                    </animateMotion>
                  </circle>
                  <circle r="3.5" fill="#2563eb">
                    <animateMotion dur="7s" repeatCount="indefinite">
                      <mpath href="#wvo1" />
                    </animateMotion>
                  </circle>
                  <text x="88" y="38" fill="#D4AF37" fontFamily="Outfit, Inter, system-ui, sans-serif" fontSize="24" fontWeight="600">
                    Developed By : Ch Brahim ENPI
                  </text>
                </svg>
                <div className="flex items-center gap-3 z-10">
                  <ThemeToggle />
                  <img
                    src="/JoB.png"
                    alt="Logo"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </div>
              </header>

              {children}
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
