import { SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenu,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col flex-auto">
      <div className="flex self-end gap-4 pb-[60px]">
        <div className="relative ml-auto flex-1 md:grow-0">
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
        </DropdownMenu>
      </div>

      {children}
    </div>
  )
}
