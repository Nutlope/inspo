import { ImageResponse } from "next/og";
import { BASE_URL } from "@/lib/base-url";

export const runtime = "edge";
export const alt = "Inspo - A thousand websites worth studying.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F4F1EC",
          color: "#1A1A1A",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#6b6862", letterSpacing: 1, textTransform: "uppercase" }}>
          <span>Inspo</span>
          <span>Open source · Together AI</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 128,
              lineHeight: 0.92,
              letterSpacing: -3,
              fontWeight: 400,
              color: "#1A1A1A",
              fontStyle: "italic",
              maxWidth: 980,
            }}
          >
            A thousand websites worth studying.
          </div>
          <div style={{ fontSize: 32, color: "#6b6862", maxWidth: 880, lineHeight: 1.35 }}>
            Curated, indexed, and addressable from your coding agent over MCP.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 22, color: "#6b6862", letterSpacing: 1 }}>
          <span style={{ color: "#C7402F" }}>●</span>
          <span>{new URL(BASE_URL).host}</span>
        </div>
      </div>
    ),
    size,
  );
}
