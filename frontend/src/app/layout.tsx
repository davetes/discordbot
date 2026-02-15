import type { ReactNode } from "react";
import "../index.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Tidy Bot Control",
  description: "Discord bot dashboard control panel",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
