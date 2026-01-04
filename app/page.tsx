import Link from "next/link";
import { Upload, Download } from "lucide-react";
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
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Send Card */}
        <Link href="/send" className="group">
          <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Send File</CardTitle>
              <CardDescription className="text-base">
                Share a file directly with another device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full cursor-pointer">
                Send
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Receive Card */}
        <Link href="/receive" className="group">
          <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Receive File</CardTitle>
              <CardDescription className="text-base">
                Receive a file using a room code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full cursor-pointer">
                Receive
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  );
}
