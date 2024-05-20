
import TopNavBar from "@/components/TopNavBar"
import { Navbar } from "@nextui-org/react"
export default function AdminLayout({
    children, // will be a page or nested layout
  }: {
    children: React.ReactNode
  }) {
    return (
      <section>
        {/* Include shared UI here e.g. a header or sidebar */}
        <nav className="h-500"><TopNavBar/></nav>
        {children}
      </section>
    )
  }