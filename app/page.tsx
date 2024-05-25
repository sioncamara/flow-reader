import { redirect } from "next/navigation"
export default function Home() {
  redirect("/library")
  return (
    <div className="flex min-h-full flex-wrap  justify-center gap-x-10 gap-y-16"></div>
  )
}
