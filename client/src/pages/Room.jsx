
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import socket from "../socket";
import ReviewScreen from "../components/ReviewScreen";

export default function Room() {
  const { roomId } = useParams();

  const [connected, setConnected] = useState(false);
  const [ready, setReady] = useState(false);
  const [partnerReady, setPartnerReady] = useState(false);
  const [bothReady, setBothReady] = useState(false);

  const [countdown, setCountdown] = useState(null);
  const [photos, setPhotos] = useState([]);

  const [partnerPhotos, setPartnerPhotos] = useState([]);
  const [stripReady, setStripReady] = useState(false);

  const [stripImage, setStripImage] = useState(null);

  const [filter, setFilter] = useState("Original");
  
  const [photoNumber, setPhotoNumber] = useState(0);
  const canvasRef = useRef(null);
  const stripCanvasRef = useRef(null);

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
      setCountdown(null);

      setPhotos([]);
      setPartnerPhotos([]);
      setPhotoNumber(0);

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
        setReady(true);
        setPartnerReady(true);
    });

    

    socket.on("start-countdown", () => {
  runCountdown(1);
});

socket.on("partner-photo", (photo) => {
  console.log("Partner photo received");

  setPartnerPhotos((previous) => {
    if (previous.length >= 4) return previous;

    return [...previous, photo];
  });
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

  useEffect(() => {
  if (
    photos.length === 4 &&
    partnerPhotos.length === 4
  ) {
    generateStrip();
  }
}, [photos, partnerPhotos]);

  function runCountdown(number) {
  setPhotoNumber(number);

  let value = 3;

  setCountdown(3);

  const timer = setInterval(() => {
    value--;

    if (value > 0) {
      setCountdown(value);
    } else if (value === 0) {
      setCountdown("📸");

      capturePhoto();

      clearInterval(timer);

      setTimeout(() => {
        setCountdown(null);

        if (number < 4) {
          runCountdown(number + 1);
        }
      }, 900);
    }
  }, 1000);
}


  function capturePhoto() {
  if (!localVideoRef.current || !canvasRef.current) return;

  const canvas = canvasRef.current;
  const video = localVideoRef.current;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(video, 0, 0);

  const image = canvas.toDataURL("image/png");

console.log("Sending photo");

socket.emit("photo-captured", {
  roomId,
  photo: image,
});

  setPhotos((previous) => {
  if (previous.length >= 4) return previous;

  return [...previous, image];
});}

async function generateStrip() {
  if (photos.length !== 4 || partnerPhotos.length !== 4) return;


  const canvas = stripCanvasRef.current;

  if (!canvas) return;


  const ctx = canvas.getContext("2d");

  canvas.width = 900;
  canvas.height = 1600;

  ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.strokeStyle = "#E8D8C8";
ctx.lineWidth = 10;
ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
  ctx.fillStyle = "#222";
ctx.textAlign = "center";

ctx.font = "bold 52px sans-serif";
ctx.fillText("Together Booth ❤️", 450, 70);

ctx.font = "26px sans-serif";
ctx.fillStyle = "#777";
ctx.fillText(
  "Capture moments together",
  450,
  110
);
  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });
  }

  for (let i = 0; i < 4; i++) {
    const myImage = await loadImage(photos[i]);
    const partnerImage = await loadImage(partnerPhotos[i]);

    const y = 120 + i * 350;

    ctx.fillStyle = "#F8F8F8";

ctx.fillRect(30, y - 10, 400, 300);
ctx.fillRect(470, y - 10, 400, 300);

ctx.save();


switch (filter) {
  case "Warm":
    ctx.filter = "sepia(35%) saturate(130%)";
    break;

  case "Vintage":
    ctx.filter = "sepia(80%)";
    break;

  case "Dreamy":
    ctx.filter = "brightness(110%) contrast(90%)";
    break;

  case "B&W":
    ctx.filter = "grayscale(100%)";
    break;

  default:
    ctx.filter = "none";
}

ctx.drawImage(myImage, 40, y, 380, 280);
ctx.drawImage(partnerImage, 480, y, 380, 280);

ctx.filter = "none";

ctx.restore();

  }

  ctx.font = "30px sans-serif";
ctx.fillStyle = "#666";

ctx.fillText(
  new Date().toLocaleDateString(),
  450,
  1520
);

ctx.font = "24px sans-serif";

ctx.fillText(
  "Made with ❤️ Together Booth",
  450,
  1565
);

console.log("Generating strip with filter:", filter);
console.log("Setting strip image");
  setStripImage(canvas.toDataURL("image/png"));
  setStripReady(true);
}


  function handleReady() {
  if (ready) return;

  setPhotos([]);
  setPartnerPhotos([]);
  setPhotoNumber(0);

  setReady(true);

  socket.emit("ready", roomId);
}

if (stripReady) {
  return (
    <ReviewScreen
  stripImage={stripImage}  
  onDownload={() => {
        const link = document.createElement("a");
        link.href = stripImage;
        const date = new Date()
  .toISOString()
  .slice(0, 10);

link.download = `TogetherBooth_${date}.png`;

link.click();
      }}
      onRetake={() => {
        setStripReady(false);
        setStripImage(null);
        setPhotos([]);
        setPartnerPhotos([]);
        setPhotoNumber(0);
        setReady(false);
        setPartnerReady(false);
        setBothReady(false);
      }}
      onLeave={() => {
        window.location.href = "/";
      }}

    />
  );
}


  return (
    <div
      style={{
        minHeight: "100vh",
        background:
        "linear-gradient(180deg,#FFF7F8,#FFF3E7)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px",
        gap: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h1
  style={{
    fontSize: "52px",
    marginBottom: "5px",
  }}
>
  Together Booth ❤️
</h1>

<p
  style={{
    color: "#666",
    marginTop: 0,
    fontSize: "18px",
  }}
>
  Capture moments together, wherever you are.
</p>
      <div
  style={{
    background: "white",
    padding: "10px 22px",
    borderRadius: "999px",
    boxShadow: "0 5px 15px rgba(0,0,0,.08)",
    marginBottom: "10px",
  }}
>
  <strong>Room:</strong> {roomId}
</div>
      <h2
        style={{
  color: connected ? "#29A745" : "#666",
  background: "#fff",
  padding: "12px 26px",
  borderRadius: "999px",
  boxShadow: "0 6px 16px rgba(0,0,0,.08)",
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
        <div
  style={{
    background: "#ffffff",
    padding: "18px",
    borderRadius: "24px",
    boxShadow: "0 12px 30px rgba(0,0,0,.12)",
  }}
>
  <h3
    style={{
      textAlign: "center",
      marginBottom: "12px",
    }}
  >
    😊 You
  </h3>

          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "430px",
              height: "320px",
              border: "5px solid white",
              boxShadow: "0 6px 20px rgba(0,0,0,.15)",
              background: "#000",
              borderRadius: "16px",
              objectFit: "cover",
            }}
          />
        </div>

        <div
  style={{
    background: "#ffffff",
    padding: "18px",
    borderRadius: "24px",
    boxShadow: "0 12px 30px rgba(0,0,0,.12)",
  }}
>
  <h3
    style={{
      textAlign: "center",
      marginBottom: "12px",
    }}
  >
    ❤️ Partner
  </h3>

          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: "430px",
              height: "320px",
              border: "5px solid white",
              boxShadow: "0 6px 20px rgba(0,0,0,.15)",
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
  padding: "16px 40px",
  fontSize: "20px",
  fontWeight: "bold",
  border: "none",
  borderRadius: "999px",
  cursor: ready ? "default" : "pointer",
  background: ready
    ? "#D4F4DD"
    : "linear-gradient(135deg,#FF7AA2,#FF5E87)",
  color: ready ? "#246B3C" : "white",
  boxShadow: "0 10px 25px rgba(255,94,135,.35)",
  transition: "all .3s ease",
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

        <h3
  style={{
    marginTop: "25px",
    color: "#FF5E87",
    fontSize: "24px",
  }}
>
  📸 Photo {photoNumber} / 4
</h3>

    <div
  style={{
    display: "flex",
    gap: "40px",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "20px",
  }}
>
  {photos.map((photo, index) => (
    <img
      key={index}
      src={photo}
      alt={`Photo ${index + 1}`}
      style={{
        width: "140px",
        borderRadius: "12px",
        border: "3px solid white",
        boxShadow: "0 6px 16px rgba(0,0,0,.2)",
      }}
    />
  ))}
</div>

<h3
  style={{
    marginTop: "30px",
    color: "#FF5E87",
  }}
>
  ❤️ Partner Photos
</h3>

<div
  style={{
    display: "flex",
    gap: "12px",
    marginTop: "20px",
    flexWrap: "wrap",
    justifyContent: "center",
  }}
>
  {partnerPhotos.map((photo, index) => (
    <img
      key={index}
      src={photo}
      alt={`Partner ${index + 1}`}
      style={{
        width: "140px",
        borderRadius: "12px",
        border: "3px solid #ff69b4",
        boxShadow: "0 6px 16px rgba(0,0,0,.2)",
      }}
    />
  ))}
</div>

</div>

<canvas
  ref={canvasRef}
  style={{ display: "none" }}
/>

<canvas
  ref={stripCanvasRef}
  style={{ display: "none" }}
/>

{countdown !== null && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        width: "220px",
        height: "220px",
        borderRadius: "50%",
        background: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "90px",
        fontWeight: "bold",
      }}
    >
      {countdown}
    </div>
  </div>
)}

</div>
);
}