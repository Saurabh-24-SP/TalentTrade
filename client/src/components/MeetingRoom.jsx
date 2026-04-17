import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ensureSocketConnected, getSocket } from "../utils/socket";

const RTC_CONFIGURATION = {
    iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
};

function normalizeSessionDescription(desc) {
    if (!desc) return null;
    // Sometimes Socket.IO serializes RTCSessionDescriptionInit already.
    if (typeof desc === "object" && desc.type && desc.sdp) return desc;
    return null;
}

export default function MeetingRoom({ roomId, userId, onLeave }) {
    const [status, setStatus] = useState("Initializing...");
    const [error, setError] = useState("");
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const socketRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteSocketIdRef = useRef(null);

    const safeRoomId = useMemo(() => String(roomId || ""), [roomId]);

    const setVideoElStream = (videoEl, stream) => {
        if (!videoEl) return;
        if (videoEl.srcObject !== stream) {
            videoEl.srcObject = stream;
        }
    };

    const cleanupPeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            try {
                peerConnectionRef.current.onicecandidate = null;
                peerConnectionRef.current.ontrack = null;
                peerConnectionRef.current.onconnectionstatechange = null;
                peerConnectionRef.current.close();
            } catch {
                // ignore
            }
            peerConnectionRef.current = null;
        }
        remoteSocketIdRef.current = null;
        if (remoteVideoRef.current) {
            try {
                remoteVideoRef.current.srcObject = null;
            } catch {
                // ignore
            }
        }
    }, []);

    const stopLocalMedia = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (localVideoRef.current) {
            try {
                localVideoRef.current.srcObject = null;
            } catch {
                // ignore
            }
        }
    }, []);

    const ensurePeerConnection = useCallback(() => {
        if (peerConnectionRef.current) return peerConnectionRef.current;

        const pc = new RTCPeerConnection(RTC_CONFIGURATION);
        peerConnectionRef.current = pc;

        pc.onicecandidate = (event) => {
            const candidate = event.candidate;
            const socket = socketRef.current;
            const to = remoteSocketIdRef.current;
            if (!candidate || !socket || !to) return;
            socket.emit("meeting:ice-candidate", {
                to,
                from: socket.id,
                candidate,
                roomId: safeRoomId,
            });
        };

        pc.ontrack = (event) => {
            const [stream] = event.streams;
            if (stream) setVideoElStream(remoteVideoRef.current, stream);
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") setStatus("Connected");
            if (pc.connectionState === "failed") setStatus("Connection failed");
            if (pc.connectionState === "disconnected") setStatus("Disconnected");
            if (pc.connectionState === "connecting") setStatus("Connecting...");
        };

        // Attach local tracks if we already have them.
        const localStream = localStreamRef.current;
        if (localStream) {
            localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
        }

        return pc;
    }, [safeRoomId]);

    const ensureLocalStream = useCallback(async () => {
        if (localStreamRef.current) return localStreamRef.current;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            setVideoElStream(localVideoRef.current, stream);

            // Apply current toggles.
            stream.getAudioTracks().forEach((t) => {
                t.enabled = isMicOn;
            });
            stream.getVideoTracks().forEach((t) => {
                t.enabled = isCamOn;
            });

            // If peer connection already exists, attach tracks.
            if (peerConnectionRef.current) {
                stream.getTracks().forEach((track) => peerConnectionRef.current.addTrack(track, stream));
            }

            return stream;
        } catch (e) {
            const message = e?.name === "NotAllowedError" ? "Camera/microphone permission denied." : "Unable to access camera/microphone.";
            setError(message);
            setStatus("Media blocked");
            throw e;
        }
    }, [isCamOn, isMicOn]);

    const createAndSendOffer = useCallback(async () => {
        const socket = socketRef.current;
        const to = remoteSocketIdRef.current;
        if (!socket || !to) return;

        setStatus("Calling...");
        const pc = ensurePeerConnection();
        await ensureLocalStream();

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("meeting:offer", {
            to,
            from: socket.id,
            sdp: pc.localDescription,
            roomId: safeRoomId,
        });
    }, [ensureLocalStream, ensurePeerConnection, safeRoomId]);

    const handleLeave = useCallback(() => {
        const socket = socketRef.current;
        if (socket && safeRoomId) {
            socket.emit("meeting:leave", { roomId: safeRoomId });
        }

        cleanupPeerConnection();
        stopLocalMedia();

        if (typeof onLeave === "function") onLeave();
    }, [cleanupPeerConnection, onLeave, safeRoomId, stopLocalMedia]);

    const toggleMic = useCallback(() => {
        const next = !isMicOn;
        setIsMicOn(next);
        const stream = localStreamRef.current;
        if (stream) stream.getAudioTracks().forEach((t) => (t.enabled = next));
    }, [isMicOn]);

    const toggleCam = useCallback(() => {
        const next = !isCamOn;
        setIsCamOn(next);
        const stream = localStreamRef.current;
        if (stream) stream.getVideoTracks().forEach((t) => (t.enabled = next));
    }, [isCamOn]);

    useEffect(() => {
        let mounted = true;

        async function start() {
            if (!safeRoomId) {
                setError("Invalid meeting room.");
                setStatus("Error");
                return;
            }

            try {
                setStatus("Connecting...");
                const socket = ensureSocketConnected(userId);
                socketRef.current = socket;

                // Ensure local media early so user sees preview.
                await ensureLocalStream();

                if (!mounted) return;

                socket.emit("meeting:join", { roomId: safeRoomId, userId });
                setStatus("Waiting for someone to join...");

                const onPeerJoined = async ({ socketId }) => {
                    if (!socketId || socketId === socket.id) return;
                    remoteSocketIdRef.current = socketId;
                    await createAndSendOffer();
                };

                const onOffer = async ({ from, sdp }) => {
                    const normalized = normalizeSessionDescription(sdp);
                    if (!from || !normalized) return;

                    remoteSocketIdRef.current = from;
                    setStatus("Incoming call...");

                    const pc = ensurePeerConnection();
                    await ensureLocalStream();

                    await pc.setRemoteDescription(normalized);
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    socket.emit("meeting:answer", {
                        to: from,
                        from: socket.id,
                        sdp: pc.localDescription,
                        roomId: safeRoomId,
                    });

                    setStatus("Connecting...");
                };

                const onAnswer = async ({ from, sdp }) => {
                    const normalized = normalizeSessionDescription(sdp);
                    if (!from || !normalized) return;
                    const pc = peerConnectionRef.current;
                    if (!pc) return;

                    await pc.setRemoteDescription(normalized);
                    setStatus("Connecting...");
                };

                const onIceCandidate = async ({ from, candidate }) => {
                    if (!from || !candidate) return;
                    const pc = peerConnectionRef.current;
                    if (!pc) return;
                    try {
                        await pc.addIceCandidate(candidate);
                    } catch {
                        // ignore
                    }
                };

                const onPeerLeft = () => {
                    setStatus("Peer left");
                    cleanupPeerConnection();
                };

                socket.on("meeting:peer-joined", onPeerJoined);
                socket.on("meeting:offer", onOffer);
                socket.on("meeting:answer", onAnswer);
                socket.on("meeting:ice-candidate", onIceCandidate);
                socket.on("meeting:peer-left", onPeerLeft);

                return () => {
                    socket.off("meeting:peer-joined", onPeerJoined);
                    socket.off("meeting:offer", onOffer);
                    socket.off("meeting:answer", onAnswer);
                    socket.off("meeting:ice-candidate", onIceCandidate);
                    socket.off("meeting:peer-left", onPeerLeft);
                };
            } catch {
                if (!mounted) return;
                setStatus("Error");
                if (!error) setError("Could not start meeting.");
            }
        }

        let cleanupSocketHandlers = null;
        start().then((cleanupFn) => {
            cleanupSocketHandlers = cleanupFn;
        });

        return () => {
            mounted = false;
            if (typeof cleanupSocketHandlers === "function") cleanupSocketHandlers();
            // Leave room & clean up media/peer connection.
            const socket = socketRef.current || getSocket();
            if (socket && safeRoomId) socket.emit("meeting:leave", { roomId: safeRoomId });
            cleanupPeerConnection();
            stopLocalMedia();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safeRoomId, userId]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Meeting</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{status}</p>
                    {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
                </div>

                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={toggleMic} className="premium-button premium-button-ghost px-4 py-2 text-xs">
                        {isMicOn ? "Mic On" : "Mic Off"}
                    </button>
                    <button type="button" onClick={toggleCam} className="premium-button premium-button-ghost px-4 py-2 text-xs">
                        {isCamOn ? "Cam On" : "Cam Off"}
                    </button>
                    <button type="button" onClick={handleLeave} className="premium-button px-4 py-2 text-xs">
                        Leave
                    </button>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">You</p>
                        <p className="text-xs text-slate-400">Local preview</p>
                    </div>
                    <div className="aspect-video bg-slate-950">
                        <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">Other person</p>
                        <p className="text-xs text-slate-400">Remote video</p>
                    </div>
                    <div className="aspect-video bg-slate-950">
                        <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4 text-xs leading-6 text-slate-500">
                Tip: For best results, open this meeting in two browsers/devices and allow camera & microphone access.
            </div>
        </div>
    );
}
