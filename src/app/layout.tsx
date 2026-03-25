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
              background: "#ffffff",
              color: "#202124",
              border: "1px solid #dadce0",
              borderRadius: "8px",
              fontSize: "14px",
              boxShadow: "0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)",
            },
            success: {
              iconTheme: {
                primary: "#188038",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#d93025",
                secondary: "#ffffff",
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
