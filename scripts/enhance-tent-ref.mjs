/**
 * 캐노피 내부 - 레퍼런스 사진 기반으로 비슷하게 생성
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
const REF = "C:\\Users\\김민재\\Desktop\\클로드스크린샷\\캐노피내부.png";
const OUT_DIR = path.join(__dirname, "..", "images", "enhanced");

const concepts = [
  {
    name: "로우 스타일 (라탄소파 + 라운지체어)",
    output: "tent_interior_low_table.jpg",
    prompt: `Create a photo that looks very similar to this reference image, but adapted for a Korean glamping BBQ resort called "더헤이븐리트리".

KEEP FROM REFERENCE:
- The SAME canopy tent structure — rectangular metal frame, white/cream fabric walls and ceiling
- The SAME furniture layout — curved dark rattan/wicker sofa on one side, reclining lounge chairs on the other side
- The SAME red accent cushions and white fur/fleece throws on the chairs
- The SAME round dark glass/rattan coffee table in the center
- The SAME cozy, intimate atmosphere inside the canopy
- The SAME camera angle — shot from inside looking toward the back

CHANGE FROM REFERENCE:
- Instead of the plain white walls in background, show one side curtain OPEN revealing green Korean mountains and blue sky outside
- On the coffee table: add Korean BBQ side dishes (반찬), plates, soju bottle and glasses, tongs — a meal is ready
- Make it DAYTIME with natural sunlight coming through the open curtain side
- Floor should be a clean concrete pad
- Add a small decorative plant or lantern for glamping atmosphere

RULES:
- Must look like a REAL photograph, photorealistic
- NO watermark, NO text, NO logo
- 4K resolution, VERTICAL/PORTRAIT orientation (taller than wide, like a phone photo 3:4 or 9:16 ratio)
- The overall vibe should match this reference exactly — luxurious, cozy glamping cabana`
  },
  {
    name: "미드 스타일 (다이닝 테이블 + 체어)",
    output: "tent_interior_mid_table.jpg",
    prompt: `Create a photo inside a canopy tent that has the SAME tent structure as this reference image, but with dining furniture instead.

KEEP FROM REFERENCE:
- The EXACT SAME canopy tent structure — rectangular metal frame, white/cream fabric walls and ceiling panels
- The SAME size and proportions of the tent
- Red accent cushions/details for color consistency

CHANGE FROM REFERENCE:
- Replace the lounge furniture with a DINING setup:
  - A rectangular or round dining table at standard height (~70cm)
  - 4-6 outdoor dining chairs (red/dark metal frame like Classic TP style)
  - On the table: Korean BBQ meal setup — 반찬, plates, grilled meat, soju, cups, tongs
- One side curtain OPEN showing green Korean mountains and blue sky
- DAYTIME with natural sunlight
- Floor is clean concrete pad

RULES:
- Must look like a REAL photograph, photorealistic
- NO watermark, NO text, NO logo
- 4K resolution, VERTICAL/PORTRAIT orientation (taller than wide, like a phone photo 3:4 or 9:16 ratio)
- The tent must look identical to the reference — same structure, same fabric style`
  }
];

async function run() {
  const refBuffer = fs.readFileSync(REF);
  const refBase64 = refBuffer.toString("base64");

  for (let i = 0; i < concepts.length; i++) {
    const c = concepts[i];
    console.log(`\n🎨 [${c.name}] 생성 중...`);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{
          parts: [
            { inlineData: { mimeType: "image/png", data: refBase64 } },
            { text: c.prompt },
          ],
        }],
        config: { responseModalities: ["TEXT", "IMAGE"] },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            fs.writeFileSync(path.join(OUT_DIR, c.output), Buffer.from(part.inlineData.data, "base64"));
            console.log(`✅ 저장 완료`);
            break;
          }
          if (part.text) console.log(`📝 ${part.text.substring(0, 200)}`);
        }
      }
    } catch (e) { console.error(`❌`, e.message); }

    if (i < concepts.length - 1) {
      console.log("⏳ 10초 대기...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  console.log("\n🎉 완료!");
}
run();
