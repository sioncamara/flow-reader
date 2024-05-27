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
  title: "Flow Reader",
  description:
    "Read your PDFs like a book with Microsofts edge read aloud feature. An alternative to Natural reader",
  icons: {
    icon: "/flow-reader.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full bg-white dark:bg-slate-900">
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
