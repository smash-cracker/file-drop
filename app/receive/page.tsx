"use client";

import * as React from "react";
import { ArrowLeft, Loader2, Download, FileCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

interface ReceivedFile {
    name: string;
    size: number;
    mimeType: string;
    blobUrl?: string;
}

export default function ReceivePage() {
    const [value, setValue] = React.useState("");
    const [isVerifying, setIsVerifying] = React.useState(false);
    const [receivedFiles, setReceivedFiles] = React.useState<ReceivedFile[]>([]);
    const [progress, setProgress] = React.useState(0);

    // WebRTC Refs
    const peerConnection = React.useRef<RTCPeerConnection | null>(null);
    const currentFileMetadata = React.useRef<ReceivedFile | null>(null);
    const receivedChunks = React.useRef<Uint8Array[]>([]);
    const bytesReceived = React.useRef(0);

    const createPeerConnection = (roomCode: string) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("signal", { roomCode, data: { candidate: event.candidate } });
            }
        };

        // This is the most important event for the receiver
        pc.ondatachannel = (event) => {
            const channel = event.channel;
            setupDataChannel(channel);
        };

        peerConnection.current = pc;
        return pc;
    };

    const setupDataChannel = (channel: RTCDataChannel) => {
        channel.binaryType = "arraybuffer"; // Ensure binary data is received as ArrayBuffer
        channel.onmessage = (event) => {
            const data = event.data;

            // Handle Metadata (JSON) vs File Data (ArrayBuffer)
            if (typeof data === "string") {
                const message = JSON.parse(data);
                if (message.type === "metadata") {
                    currentFileMetadata.current = message;
                    receivedChunks.current = [];
                    bytesReceived.current = 0;
                    console.log("Receiving file:", message.name);
                } else if (message.type === "completed") {
                    finalizeFile();
                }
            } else {
                // Binary chunk received
                console.log("Binary chunk received, size:", data.byteLength);
                const chunk = new Uint8Array(data);
                receivedChunks.current.push(chunk);
                bytesReceived.current += chunk.byteLength;

                if (currentFileMetadata.current) {
                    const currentProgress = (bytesReceived.current / currentFileMetadata.current.size) * 100;
                    setProgress(Math.round(currentProgress));
                }
            }
        };
    };

    const finalizeFile = () => {
        if (!currentFileMetadata.current) return;

        const blob = new Blob(receivedChunks.current as BlobPart[], { type: currentFileMetadata.current.mimeType });
        const url = URL.createObjectURL(blob);

        setReceivedFiles(prev => [...prev, {
            ...currentFileMetadata.current!,
            blobUrl: url
        }]);

        toast.success(`Received ${currentFileMetadata.current.name}!`);
        setProgress(0);
    };

    // Use a ref to keep track of the current room code for the listeners
    const roomCodeRef = React.useRef(value);
    React.useEffect(() => {
        roomCodeRef.current = value;
    }, [value]);

    React.useEffect(() => {
        socket.on("signal", async (data) => {
            const roomCode = roomCodeRef.current;
            if (!roomCode) return;

            if (data.sdp && data.sdp.type === "offer") {
                console.log("Offer received, creating answer...");
                const pc = peerConnection.current || createPeerConnection(roomCode);

                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                // Send the answer back to the sender
                socket.emit("signal", { roomCode, data: { sdp: pc.localDescription } });
            } else if (data.candidate) {
                console.log("ICE Candidate received");
                const pc = peerConnection.current;
                if (pc) {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            }
        });

        return () => {
            socket.off("signal");
            if (peerConnection.current) {
                peerConnection.current.close();
                peerConnection.current = null;
            }
        };
    }, []); // Empty dependency array keeps this listener active for the life of the page

    const handleVerify = () => {
        if (value.length !== 6 || isVerifying) return; // Prevent double-clicks
        setIsVerifying(true);

        if (!socket.connected) {
            socket.connect();
        }

        // Set up the one-time connection event
        socket.once("peer-connected", () => {
            setIsVerifying(false);
            toast.info("Connected to sender! Handshaking...");
        });

        socket.emit("join-room", value);
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
                        {receivedFiles.length > 0 ? "Files received successfully" : "Enter the 6-digit code to receive files"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    {receivedFiles.length === 0 ? (
                        <>
                            <div className="flex justify-center w-full">
                                <InputOTP maxLength={6} value={value} onChange={setValue}>
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
                            <Button className="w-full" onClick={handleVerify} disabled={value.length !== 6 || isVerifying}>
                                {isVerifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</> : "Receive Files"}
                            </Button>
                        </>
                    ) : (
                        <div className="w-full space-y-4">
                            {receivedFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-accent/10">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <FileCheck className="text-primary shrink-0" />
                                        <div className="truncate text-sm font-medium">{file.name}</div>
                                    </div>
                                    <Button size="sm" variant="outline" asChild>
                                        <a href={file.blobUrl} download={file.name}>
                                            <Download className="size-4 mr-2" /> Save
                                        </a>
                                    </Button>
                                </div>
                            ))}
                            <Button variant="ghost" className="w-full" onClick={() => setReceivedFiles([])}>Receive More</Button>
                        </div>
                    )}

                    {progress > 0 && progress < 100 && (
                        <div className="w-full space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Downloading...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
