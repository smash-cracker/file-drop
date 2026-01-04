import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

export default function Navbar() {
  return (
    <nav>
      <div className="flex h-16 items-center p-4 mx-auto justify-between">
        <Link href="/" className="font-bold text-2xl tracking-tight">
          Drop
        </Link>
        <div className="flex items-center gap-4">
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}
