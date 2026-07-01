import { useNavigate } from "react-router-dom";

function randomRoom() {
  const adjectives = [
    "sunset",
    "lavender",
    "moon",
    "cozy",
    "strawberry",
    "cloud",
    "golden",
    "dreamy",
  ];

  const animals = [
    "panda",
    "otter",
    "cat",
    "fox",
    "bear",
    "bunny",
    "duck",
    "koala",
  ];

  const adjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];

  const animal =
    animals[Math.floor(Math.random() * animals.length)];

  const number = Math.floor(100 + Math.random() * 900);

  return `${adjective}-${animal}-${number}`;
}

export default function Home() {
  const navigate = useNavigate();

  function createRoom() {
    navigate(`/room/${randomRoom()}`);
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#F8F3EA",
      }}
    >
      <button
        onClick={createRoom}
        style={{
          padding: "18px 34px",
          fontSize: "22px",
          borderRadius: "18px",
          border: "none",
          cursor: "pointer",
        }}
      >
        ❤️ Create Booth
      </button>
    </div>
  );
}