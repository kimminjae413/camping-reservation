/**
 * 10번 사진 향상 - 직원 공간 유리벽 + 바베큐 세팅
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

const INPUT = path.join(__dirname, "..", "images", "KakaoTalk_20260406_230249446_10.jpg");
const OUTPUT = path.join(__dirname, "..", "images", "enhanced", "KakaoTalk_20260406_230249446_10_enhanced.jpg");

const prompt = `Transform this glamping resort photo into a premium marketing image.

IMPORTANT: The image is rotated 90 degrees clockwise. You MUST fix the rotation first so it displays in proper upright landscape orientation.

CONTEXT about this photo:
- This shows a glamping resort called "더헤이븐리트리" (The Heavenly Tree)
- There is a concrete open-roof building with pillars on the LEFT side — this is the STAFF kitchen and self-service bar area
- There are concrete square deck pads on the ground in front of the building — these are individual BBQ zones
- "HAVEN" signage wall visible in the background
- Mountains and blue sky

TWO AREAS TO MODIFY:

1. STAFF KITCHEN BUILDING (the concrete open structure with roof and pillars):
   - Install modern GLASS WALLS between the concrete pillars — clear glass panels that enclose the space
   - Inside should look like a clean, professional food prep kitchen where staff cut meat and prepare ingredients for customers
   - Also include a self-service bar area visible through the glass
   - The glass walls should look sleek and modern, fitting the concrete architecture
   - Inside should be well-lit and look hygienic and professional

2. BBQ ZONES (the concrete square pads on the ground):
   - On each concrete pad, place BBQ equipment:
     - A half-drum charcoal BBQ grill (반으로 자른 드럼통 숯불 그릴) — Korean outdoor style
     - A folding table with camping chairs around it
   - Same style as the other photos in this series — CONSISTENT equipment across all images
   - No people needed on this photo, just the equipment setup ready for use

PHOTO ENHANCEMENT:
- Keep DAYTIME setting — bright blue sky, clear afternoon sunlight, just like the original
- Do NOT add sunset or golden hour. Keep clear blue sky.
- Enhance the green mountains with rich, vivid tones
- Make grass vibrant emerald green and well-maintained
- Remove the garden hose reel visible on the grass — keep the lawn clean
- Enhance overall sharpness and color vibrancy
- 4K ultra-high resolution, professional photography
- Must look like a REAL DSLR photograph, NOT AI-generated
- ABSOLUTELY NO watermark, logo, text overlay, or any writing on the image`;

async function run() {
  console.log("🎨 10번 사진 향상 중 (유리벽 + 바베큐 세팅)...");

  const imageBuffer = fs.readFileSync(INPUT);
  const base64Image = imageBuffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: prompt },
          ],
        },
      ],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(OUTPUT, imageData);
          console.log(`✅ 저장 완료: ${OUTPUT}`);
          return;
        }
        if (part.text) console.log(`📝 텍스트: ${part.text.substring(0, 300)}`);
      }
    }
    console.log("⚠️ 이미지 응답 없음");
  } catch (error) {
    console.error("❌ 에러:", error.message);
  }
}

run();
