import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "BriefCraft - Creative Brief & Script Manager",
  description: "Manage creative briefs, scripts, and campaigns for your team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e1e1e",
              color: "#e5e5e5",
              border: "1px solid #2a2a2a",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
