"use client"
import Link from "next/link"
import {
  TooltipTrigger,
  TooltipContent,
  Tooltip,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { SheetTrigger, SheetContent, Sheet } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import {
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenu,
} from "@/components/ui/dropdown-menu"
import { CirclePlus, LibraryBig } from "lucide-react"
import { useSelectedLayoutSegment } from "next/navigation"
import clsx from "clsx"
import Image from "next/image"
import * as SheetPrimitive from "@radix-ui/react-dialog"

type NavOption = {
  label: string
  slug: string
  icon: JSX.Element
}

const navOptions: NavOption[] = [
  {
    label: "Add PDF",
    slug: "add-pdf",
    icon: <CirclePlus />,
  },
  {
    label: "Library",
    slug: "library",
    icon: <LibraryBig />,
  },
]

export function GlobalNav({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-100/40 dark:bg-slate-900">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-white sm:flex dark:border-slate-950 dark:bg-slate-950">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <TooltipProvider>
            {/* <Link
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-900 text-lg font-semibold text-slate-50 md:h-8 md:w-8 md:text-base dark:bg-slate-50 dark:text-slate-900"
              href="/"
            >
              <Package2Icon className="h-4 w-4 transition-all group-hover:scale-110" />
              <span className="sr-only">DoDo Inc</span>
            </Link> */}
            {navOptions.map((item) => (
              <TooltipNavOption key={item.slug} item={item} />
            ))}
          </TooltipProvider>
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-slate-950 md:h-8 md:w-8 dark:text-slate-400 dark:hover:text-slate-50"
                  href="#"
                >
                  <SettingsIcon className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </aside>
      <div className="flex h-full flex-auto flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 sm:static sm:h-auto  sm:border-0 sm:bg-transparent sm:px-6 dark:border-slate-700 dark:bg-slate-900">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                className="sm:hidden dark:text-slate-400"
                size="icon"
                variant="outline"
              >
                <PanelLeftIcon className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              className="sm:max-w-xs dark:border-slate-700"
              side="left"
            >
              <nav className="grid gap-6 text-lg font-medium">
                {/* <Link
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-900 text-lg font-semibold text-slate-50 md:text-base dark:bg-slate-50 dark:text-slate-900"
                  href="#"
                >
                  <Package2Icon className="h-5 w-5 transition-all group-hover:scale-110" />
                  <span className="sr-only">Acme Inc</span>
                </Link> */}
                {navOptions.map((item) => (
                  <SheetNavOption key={item.slug} item={item} />
                ))}
                {/* <Link
                  className="flex items-center gap-4 px-2.5 text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-50"
                  href="#"
                >
                  <SettingsIcon className="h-5 w-5" />
                  Settings
                </Link> */}
              </nav>
            </SheetContent>
          </Sheet>
          {/* <div className="relative ml-auto flex-1 md:grow-0">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
            <Input
              className="w-full rounded-lg bg-white pl-8 md:w-[200px] lg:w-[336px] dark:bg-slate-950 dark:text-slate-50"
              placeholder="Search..."
              type="search"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="overflow-hidden rounded-full"
                size="icon"
                variant="outline"
              >
                <Image
                  alt="Avatar"
                  className="overflow-hidden rounded-full"
                  height={36}
                  src="/placeholder-user.jpg"
                  style={{
                    aspectRatio: "36/36",
                    objectFit: "cover",
                  }}
                  width={36}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </header>

        <main className="flex flex-auto">
          <div className="flex w-full flex-auto justify-center px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function TooltipNavOption({ item }: { item: NavOption }) {
  const segment = useSelectedLayoutSegment()
  const isActive = item.slug === segment

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          className={clsx(
            "flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-slate-950 md:h-8 md:w-8",

            "dark:text-slate-400 dark:hover:text-slate-200",
            {
              "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-300 dark:hover:text-slate-300":
                isActive,
            },
          )}
          href={`/${item.slug}`}
        >
          <span className="h-6 w-6">{item.icon}</span>
          <span className="sr-only">{item.label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}
function SheetNavOption({ item }: { item: NavOption }) {
  const segment = useSelectedLayoutSegment()
  const isActive = item.slug === segment

  return (
    <SheetPrimitive.Close asChild>
      <Link
        className={clsx(
          "flex items-center gap-4 px-2.5 text-slate-500 hover:text-slate-950",

          "dark:text-slate-400 dark:hover:text-slate-50",
          {
            "text-slate-950 dark:text-slate-50": isActive,
          },
        )}
        href={`/${item.slug}`}
        // onClick={() => {
        //   console.log('does this execute close')
        //   close()
        // }}
      >
        <span className="h-5 w-5">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    </SheetPrimitive.Close>
  )
}

function Package2Icon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
      <path d="M12 3v6" />
    </svg>
  )
}

function PanelLeftIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="9" x2="9" y1="3" y2="21" />
    </svg>
  )
}

function SearchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function SettingsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
