import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Machine Intelligence Dashboard",
  description: "Premium operations dashboard for machine state and anomaly monitoring."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
