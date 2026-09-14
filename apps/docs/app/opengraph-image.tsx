import { ImageResponse } from "next/og";

export const alt = "tynt docs - Build tiny monochrome browser games";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#ffffff",
        color: "#000000",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: 80,
        width: "100%",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", gap: 42, maxWidth: 980, width: "100%" }}>
        <div style={{ display: "flex", flexWrap: "wrap", height: 112, width: 112 }}>
          {[0, 1, 2, 3].map((shade) => (
            <div
              key={shade}
              style={{ background: ["#000000", "#555555", "#aaaaaa", "#ffffff"][shade], border: "2px solid #000000", height: 56, width: 56 }}
            />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "monospace", fontSize: 76, fontWeight: 700, letterSpacing: -4 }}>tynt docs</div>
          <div style={{ fontFamily: "monospace", fontSize: 30, marginTop: 18 }}>Build tiny monochrome browser games.</div>
        </div>
      </div>
    </div>,
    size,
  );
}
