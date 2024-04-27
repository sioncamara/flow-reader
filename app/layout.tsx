import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { GlobalNav } from "@/components/global-nav"
import "@/styles/globals.css"
import { cn } from "@/lib/utils"

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "DoDo Reader",
  description: "Read your PDFs like a book",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full bg-white">
      <body
        className={cn(
          "h-full bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <GlobalNav>{children}</GlobalNav>
      </body>
    </html>
  )
}
