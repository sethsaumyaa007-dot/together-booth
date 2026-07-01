
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import socket from "../socket";

export default function Room() {
  const { roomId } = useParams();

  const [connected, setConnected] = useState(false);
  const [ready, setReady] = useState(false);
  const [partnerReady, setPartnerReady] = useState(false);
  const [bothReady, setBothReady] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const configuration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) return;

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket.emit("join-room", roomId);
      } catch (err) {
        console.error(err);
        alert("Could not access camera or microphone.");
      }
    }

    start();

    function createPeerConnection() {
      if (peerConnectionRef.current) {
        return peerConnectionRef.current;
      }

      const pc = new RTCPeerConnection(configuration);

      peerConnectionRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      return pc;
    }

    socket.on("partner-connected", () => {
      setConnected(true);
    });

    socket.on("partner-left", () => {
      setConnected(false);
      setReady(false);
      setPartnerReady(false);
      setBothReady(false);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    });

    socket.on("partner-ready", () => {
      setPartnerReady(true);
    });

    socket.on("both-ready", () => {
      setBothReady(true);
    });

    socket.on("room-full", () => {
      alert("Room Full");
    });

    socket.on("create-offer", async () => {
      const pc = createPeerConnection();

      const offer = await pc.createOffer();

      await pc.setLocalDescription(offer);

      socket.emit("offer", {
        roomId,
        offer,
      });
    });

    socket.on("offer", async (offer) => {
      const pc = createPeerConnection();

      await pc.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await pc.createAnswer();

      await pc.setLocalDescription(answer);

      socket.emit("answer", {
        roomId,
        answer,
      });
    });

    socket.on("answer", async (answer) => {
      if (!peerConnectionRef.current) return;

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("ice-candidate", async (candidate) => {
      if (!peerConnectionRef.current) {
        createPeerConnection();
      }

      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      mounted = false;

      socket.removeAllListeners();

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [roomId]);

  function handleReady() {
    if (ready) return;

    setReady(true);

    socket.emit("ready", roomId);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F3EA",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px",
        gap: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Together Booth ❤️</h1>

      <h2>{roomId}</h2>

      <h2
        style={{
          color: connected ? "green" : "#333",
        }}
      >
        {connected ? "❤️ Connected" : "Waiting for your partner..."}
      </h2>

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <div>
          <h3>You</h3>

          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "420px",
              height: "315px",
              background: "#000",
              borderRadius: "16px",
              objectFit: "cover",
            }}
          />
        </div>

        <div>
          <h3>Partner</h3>

          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: "420px",
              height: "315px",
              background: "#000",
              borderRadius: "16px",
              objectFit: "cover",
            }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          onClick={handleReady}
          disabled={!connected || ready}
          style={{
            padding: "14px 28px",
            fontSize: "18px",
            border: "none",
            borderRadius: "14px",
            cursor: ready ? "default" : "pointer",
          }}
        >
          {ready ? "❤️ Ready" : "Ready ❤️"}
        </button>



        <div>
          <strong>You:</strong>{" "}
          {ready ? "❤️ Ready" : "Waiting..."}
        </div>

        <div>
          <strong>Partner:</strong>{" "}
          {partnerReady ? "❤️ Ready" : "Waiting..."}
        </div>

        {bothReady && (
          <h2
            style={{
              color: "#e91e63",
              marginTop: "10px",
            }}
          >
            ❤️ Both Ready
          </h2>
        )}
      </div>
    </div>
  );
}

