/**
 * 10번 사진만 재시도 - 캐노피가 콘크리트 패드를 완전히 덮도록
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

IMPORTANT: The image is rotated 90 degrees clockwise. Fix the rotation to proper upright landscape orientation FIRST.

CONTEXT:
- Glamping resort "더헤이븐리트리"
- LEFT side: concrete building with roof and pillars = staff kitchen. Install modern GLASS WALLS between pillars. Inside looks like a clean professional kitchen.
- CENTER/RIGHT: concrete square pads on the ground = individual BBQ zones
- "HAVEN" wall in background, mountains

WHAT TO PLACE ON EACH CONCRETE PAD:

Each concrete pad in the original photo is approximately 5m x 5m. On each pad, place:

A. A LARGE white Classic TP style square cabana tent that is 5m x 5m — the EXACT same size as the concrete pad.
   - The tent poles sit on the four corners of the concrete pad
   - The tent roof covers the entire pad from edge to edge
   - You should NOT be able to see any concrete floor peeking out from under the tent
   - The tent has white fabric walls, some sides with curtains tied back
   - Inside visible: table and chairs

B. NEXT TO the tent (on the grass beside the pad): a half-drum charcoal BBQ grill with a simple tarp/shade over it

PHOTO RULES:
- Keep DAYTIME — bright blue sky, clear sunlight
- Enhance green mountains, vibrant grass
- Remove garden hose from grass
- Must look like a REAL DSLR photo
- NO watermark, NO text, NO logo on the image
- 4K resolution`;

async function run() {
  console.log("🎨 10번 재시도 (큰 캐노피)...");
  const imageBuffer = fs.readFileSync(INPUT);
  const base64Image = imageBuffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
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
    console.log("⚠️ 이미지 응답 없음");
  } catch (e) { console.error("❌", e.message); }
}
run();
