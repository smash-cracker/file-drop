import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-4rem)]  flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-4">
        {/* Send Card */}
        <Card>
          <CardHeader>
            <CardTitle>Send File</CardTitle>
            <CardDescription>
              Share a file directly with another device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/send">
              <Button className="w-full">Send</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Receive Card */}
        <Card>
          <CardHeader>
            <CardTitle>Receive File</CardTitle>
            <CardDescription>Receive a file using a room code</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/receive">
              <Button className="w-full">Receive</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
