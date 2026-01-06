import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Previous Service Filter",
  description: "Convert quote CSVs into the Previous Service format",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
