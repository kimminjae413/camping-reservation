/**
 * 공사현장 → 완성 (원본 최대 보존 + 두 영역)
 */
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=["']?(.+?)["']?$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
}

const ai = new GoogleGenAI({ apiKey: envVars.GEMINI_API_KEY });
const OUT_DIR = path.join(__dirname, "..", "images", "enhanced");

const INPUT = "C:\\Users\\김민재\\Desktop\\클로드스크린샷\\실제4.png";
const OUTPUT = path.join(OUT_DIR, "construction_4_completed.jpg");

const prompt = `Edit this photo MINIMALLY. Keep the EXACT same camera angle, terrain shape, mountain backdrop, sky, trees, and overall composition. Only replace the construction items on the dirt area.

CRITICAL: Do NOT change the camera perspective, do NOT change the mountains, do NOT change the sky, do NOT reshape the terrain. The result should look like the SAME photo taken from the SAME spot, just months later after construction is finished.

REMOVE ONLY:
- The white container box on the right
- The cars
- The person walking
- Rock piles and construction materials
- The fence on the left

ON THE LEFT HALF of the dirt area:
- Replace bare dirt with GREEN GRASS
- Place 3-4 large white BELL TENTS (벨텐트) on wooden deck platforms
- These are the "두가족" (two-family) sites — large tents

ON THE RIGHT HALF of the dirt area:
- Replace bare dirt with GRAY CRUSHED GRAVEL (파쇄석)
- Place 2-3 small white TIPI TENTS (티피텐트) on wooden deck platforms
- In front of each tipi: a small fire pit + 2 chairs
- These are the "한가족" (one-family) sites — smaller, intimate

A PATHWAY between the two zones.

PRESERVE EXACTLY:
- The exact mountain shapes, colors, and positions
- The sky and clouds exactly as they are
- The concrete wall on the left edge
- All surrounding trees and vegetation
- The overall terrain slope and elevation
- The camera angle and perspective — DO NOT change the viewpoint

NO watermark, NO text, NO logo. 4K resolution. Must look photorealistic.`;

async function run() {
  console.log("🏕️ 원본 보존 + 두 영역 생성...");
  const imageBuffer = fs.readFileSync(INPUT);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/png", data: imageBuffer.toString("base64") } },
          { text: prompt },
        ],
      }],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          fs.writeFileSync(OUTPUT, Buffer.from(part.inlineData.data, "base64"));
          console.log("✅ 저장 완료");
          return;
        }
        if (part.text) console.log(`📝 ${part.text.substring(0, 200)}`);
      }
    }
    console.log("⚠️ 이미지 없음");
  } catch (e) { console.error("❌", e.message); }
}
run();
