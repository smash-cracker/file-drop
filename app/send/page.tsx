"use client";
import {
  Upload,
  X,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { PulsingIcon } from "@/components/ui/pulsing-icon";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { socket } from "@/lib/socket";
const CHUNK_SIZE = 65536;
export default function SendPage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isSent, setIsSent] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [isCopied, setIsCopied] = React.useState(false);
  const [peerConnected, setPeerConnected] = React.useState(false);
  const [isTransferring, setIsTransferring] = React.useState(false);
  const [transferComplete, setTransferComplete] = React.useState(false);
  const [transferFailed, setTransferFailed] = React.useState(false);
  const [transferProgress, setTransferProgress] = React.useState(0);
  const peerConnection = React.useRef<RTCPeerConnection | null>(null);
  const dataChannel = React.useRef<RTCDataChannel | null>(null);
  const createPeerConnection = (roomCode: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", {
          roomCode,
          data: { candidate: event.candidate },
        });
      }
    };
    peerConnection.current = pc;
    return pc;
  };
  React.useEffect(() => {
    if (!code) return;
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("join-room", code);
    socket.on("peer-connected", async () => {
      if (peerConnection.current) {
        console.log("Peer connection already exists, skipping duplicate setup");
        return;
      }
      setPeerConnected(true);
      toast.info("Receiver connected! Initializing P2P...");
      const pc = createPeerConnection(code);
      const dc = pc.createDataChannel("file-transfer", { ordered: true });
      dc.bufferedAmountLowThreshold = 524288;
      dataChannel.current = dc;
      dc.onopen = () => {
        console.log("Data channel is open!");
        startFileTransfer();
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("Sending offer to receiver...");
      socket.emit("signal", {
        roomCode: code,
        data: { sdp: pc.localDescription },
      });
    });
    socket.on("signal", async (data) => {
      if (!peerConnection.current) return;
      if (data.sdp && data.sdp.type === "answer") {
        console.log("Answer received from receiver!");
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.sdp)
        );
      } else if (data.candidate) {
        console.log("ICE Candidate received");
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      }
    });
    socket.on("peer-disconnected", () => {
      console.log("Peer disconnected");
      setPeerConnected(false);
      if (isTransferring) {
        setIsTransferring(false);
        setTransferFailed(true);
        toast.error("Transfer failed: Receiver disconnected");
        dataChannel.current?.close();
        peerConnection.current?.close();
        socket.disconnect();
      } else {
        toast.info("Receiver disconnected");
      }
    });
    return () => {
      socket.off("peer-connected");
      socket.off("peer-disconnected");
      socket.off("signal");
      peerConnection.current?.close();
    };
  }, [code]);
  const startFileTransfer = async () => {
    if (!dataChannel.current || files.length === 0) return;
    setIsTransferring(true);
    setTransferProgress(0);
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    let totalBytesSent = 0;
    for (const file of files) {
      console.log(`Starting transfer for: ${file.name} (${file.size} bytes)`);
      const metadata = {
        type: "metadata",
        name: file.name,
        size: file.size,
        mimeType: file.type,
      };
      dataChannel.current.send(JSON.stringify(metadata));
      await new Promise((r) => setTimeout(r, 100));
      let offset = 0;
      let chunkCount = 0;
      while (offset < file.size) {
        const sliceEnd = Math.min(offset + CHUNK_SIZE, file.size);
        const chunk = file.slice(offset, sliceEnd);
        const buffer = await chunk.arrayBuffer();
        if (
          dataChannel.current.bufferedAmount >
          dataChannel.current.bufferedAmountLowThreshold
        ) {
          await new Promise((resolve) => {
            dataChannel.current!.onbufferedamountlow = () => {
              dataChannel.current!.onbufferedamountlow = null;
              resolve(null);
            };
          });
        }
        dataChannel.current.send(buffer);
        offset += buffer.byteLength;
        totalBytesSent += buffer.byteLength;
        chunkCount++;
        const progress = Math.round((totalBytesSent / totalSize) * 100);
        if (progress !== transferProgress) {
          setTransferProgress(progress);
        }
        if (chunkCount % 100 === 0) {
          console.log(
            `Sent chunk ${chunkCount}, total bytes: ${offset}, progress: ${progress}%`
          );
        }
      }
      console.log(`Finished sending ${file.name}. Total chunks: ${chunkCount}`);
      dataChannel.current.send(JSON.stringify({ type: "completed" }));
    }
    toast.success("Transfer complete!");
    setIsTransferring(false);
    setTransferComplete(true);
    dataChannel.current?.close();
    peerConnection.current?.close();
    socket.disconnect();
  };
  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  const handleSend = () => {
    if (files.length === 0) return;
    const newCode = generateCode();
    setCode(newCode);
    setIsSent(true);
    setPeerConnected(false);
    socket.connect();
    socket.emit("join-room", newCode);
    toast.success("Files ready to share!");
  };
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };
  const handleSendMore = () => {
    setIsSent(false);
    setFiles([]);
    setCode("");
    setPeerConnected(false);
    setIsTransferring(false);
    setTransferComplete(false);
    setTransferFailed(false);
    setTransferProgress(0);
    setIsCopied(false);
    dataChannel.current?.close();
    peerConnection.current?.close();
    peerConnection.current = null;
    dataChannel.current = null;
  };
  const onFileValidate = React.useCallback(
    (file: File): string | null => {
      if (files.length >= 2) {
        return "You can only upload up to 2 files";
      }
      return null;
    },
    [files]
  );
  const onFileReject = React.useCallback((file: File, message: string) => {
    toast(message, {
      description: `"${
        file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name
      }" has been rejected`,
    });
  }, []);
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          {!isSent && (
            <Link
              href="/"
              className="absolute left-6 top-6 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
          )}
          <CardTitle className="text-center text-2xl">
            {transferFailed
              ? "Transfer Failed"
              : transferComplete
              ? "Transfer Complete"
              : isSent
              ? "Ready to Receive"
              : "Send Files"}
          </CardTitle>
          <CardDescription className="text-center">
            {transferFailed
              ? "File transfer was interrupted"
              : transferComplete
              ? "Your files have been successfully transferred"
              : isSent
              ? "Share this code with the receiver"
              : "Upload files to generate a share code"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transferFailed ? (
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-destructive/10 p-4">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-semibold text-lg">Transfer Interrupted</p>
                  <p className="text-sm text-muted-foreground">
                    Receiver disconnected during transfer
                  </p>
                </div>
              </div>
              <Button className="w-full" onClick={handleSendMore}>
                Send Again
              </Button>
            </div>
          ) : transferComplete ? (
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-semibold text-lg">
                    Files Sent Successfully!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {files.length} {files.length === 1 ? "file" : "files"}{" "}
                    transferred
                  </p>
                </div>
              </div>
              <Button className="w-full" onClick={handleSendMore}>
                Send Again
              </Button>
            </div>
          ) : !isSent ? (
            <div className="space-y-6">
              <FileUpload
                value={files}
                onValueChange={setFiles}
                onFileValidate={onFileValidate}
                onFileReject={onFileReject}
                maxFiles={2}
                className="w-full"
                multiple
              >
                <FileUploadDropzone>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center justify-center rounded-full border p-2.5">
                      <Upload className="size-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-sm">
                      Drag & drop files here
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Or click to browse (max 2 files)
                    </p>
                  </div>
                  <FileUploadTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-2 w-fit">
                      Browse files
                    </Button>
                  </FileUploadTrigger>
                </FileUploadDropzone>
                <FileUploadList>
                  {files.map((file) => (
                    <FileUploadItem key={file.name} value={file}>
                      <FileUploadItemPreview />
                      <FileUploadItemMetadata />
                      <FileUploadItemDelete asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <X />
                        </Button>
                      </FileUploadItemDelete>
                    </FileUploadItem>
                  ))}
                </FileUploadList>
              </FileUpload>
              <Button
                className="w-full"
                onClick={handleSend}
                disabled={files.length === 0}
              >
                Get Share Code
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 py-4">
                {isTransferring ? (
                  <CircularProgress
                    value={transferProgress}
                    size={120}
                    strokeWidth={10}
                    showLabel
                    labelClassName="text-xl font-bold"
                    renderLabel={(progress) => `${progress}%`}
                    shape="round"
                  />
                ) : (
                  <PulsingIcon />
                )}
                <p className="text-sm font-medium text-muted-foreground animate-pulse py-4">
                  {isTransferring
                    ? "Transferring..."
                    : peerConnected
                    ? "Peer Connected!"
                    : "Waiting for receiver..."}
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-6xl font-bold tracking-widest font-mono py-2 select-all">
                  {code}
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter this code on the receiving device
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleCopyCode}
                >
                  {isCopied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
