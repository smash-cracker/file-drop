"use client";

import * as React from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";

export default function ReceivePage() {
    const [value, setValue] = React.useState("");
    const [isVerifying, setIsVerifying] = React.useState(false);

    const handleVerify = () => {
        if (value.length !== 6) return;

        setIsVerifying(true);
        // Simulate verification
        setTimeout(() => {
            setIsVerifying(false);
            toast.success("Code verified! Starting download...");
        }, 1500);
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="relative">
                    <Link href="/" className="absolute left-6 top-6 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <CardTitle className="text-center text-2xl">Receive File</CardTitle>
                    <CardDescription className="text-center">
                        Enter the 6-digit code to receive files
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="flex justify-center w-full">
                        <InputOTP
                            maxLength={6}
                            value={value}
                            onChange={(value) => setValue(value)}
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleVerify}
                        disabled={value.length !== 6 || isVerifying}
                    >
                        {isVerifying ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            "Receive Files"
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
