export default function ReviewScreen({
  stripImage,
  onDownload,
  onRetake,
  onLeave,
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFF7F8",
        padding: "40px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          display: "flex",
          gap: "40px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: "340px",
            background: "#fff",
            padding: "30px",
            borderRadius: "28px",
            textAlign: "center",
            boxShadow: "0 15px 40px rgba(0,0,0,.12)",
          }}
        >
          <h1
            style={{
              margin: 0,
              color: "#FF5E87",
            }}
          >
            ❤️ Together Booth
          </h1>

          <p
            style={{
              color: "#666",
              margin: "15px 0 30px",
            }}
          >
            Your photostrip is ready!
          </p>

          <img
            src={stripImage}
            alt="Photostrip"
            style={{
              width: "100%",
              maxWidth: "470px",
              borderRadius: "18px",
              border: "14px solid white",
              boxShadow: "0 25px 60px rgba(0,0,0,.22)",
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            minWidth: "320px",
            background: "#fff",
            padding: "30px",
            borderRadius: "28px",
            boxShadow: "0 15px 40px rgba(0,0,0,.12)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#333",
            }}
          >
            Your strip is ready 🎉
          </h2>

          <p
            style={{
              color: "#666",
              marginBottom: "30px",
            }}
          >
            Download it, retake it, or leave the booth.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <button
              onClick={onDownload}
              style={{
                padding: "16px",
                border: "none",
                borderRadius: "16px",
                background: "#FF5E87",
                color: "white",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ⬇ Download Strip
            </button>

            <button
              onClick={onRetake}
              style={{
                padding: "16px",
                border: "none",
                borderRadius: "16px",
                background: "#FFE7EE",
                color: "#FF5E87",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🔄 Retake Photos
            </button>

            <button
              onClick={onLeave}
              style={{
                padding: "16px",
                border: "none",
                borderRadius: "16px",
                background: "#F3F3F3",
                color: "#444",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🚪 Leave Booth
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}