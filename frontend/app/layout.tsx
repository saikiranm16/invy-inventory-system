import type { Metadata } from "next";
import AuthProvider from "../context/AuthContext";
import AppPreferencesProvider from "../context/AppPreferencesContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invy | Inventory Management",
  description:
    "Track products, stock movement, categories, and dashboards in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppPreferencesProvider>
          <AuthProvider>{children}</AuthProvider>
        </AppPreferencesProvider>
      </body>
    </html>
  );
}
