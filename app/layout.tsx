import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "周报通 / WeeklyFlow",
  description: "单项目周报填写、汇总与管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
