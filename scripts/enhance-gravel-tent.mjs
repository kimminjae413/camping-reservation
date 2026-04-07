/**
 * 파쇄석 위 캐노피 텐트 설치 이미지 생성
 * 참조: 자갈 바닥 위 감성 글램핑 텐트
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
const ORIGINAL_REF = path.join(__dirname, "..", "images", "enhanced", "KakaoTalk_20260406_230249446_enhanced.jpg");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const TENT_DESC = `GLAMPING TENT STYLE (MUST MATCH):
- Canvas/fabric glamping tent with A-FRAME peaked roof (삼각형 지붕)
- Beige/cream/khaki colored thick canvas fabric
- Wooden or metal frame structure
- Front entrance with canvas flaps that can be tied open
- Size: ~4m x 4m, ~3m tall at peak
- Think: luxury safari tent / bell tent / lodge tent style
- NOT a cabana, NOT a flat-roof canopy — this is a proper TENT with a peaked/ridge roof
- Similar to Kodiak Canvas, Springbar, or Korean glamping bell tents`;

const photos = [
  {
    name: "파쇄석 위 텐트 - 정면 클로즈업",
    output: "gravel_tent_front.jpg",
    prompt: `Generate a photo of a beige canvas glamping tent set up on GRAY CRUSHED GRAVEL (파쇄석) ground at a luxury glamping resort in Korean mountains.

${TENT_DESC}

SCENE: Front-facing close-up view of ONE glamping tent on gray crushed gravel ground (gray/blue crushed stone, 2-3cm pieces). Camera at eye level, looking at the tent entrance which is tied open showing the cozy interior.

SETUP IN FRONT OF THE TENT (on the gravel):
- 2-3 wooden folding camping chairs (Kermit chairs, beige canvas + wood frame)
- A small wooden folding side table with a coffee cup
- A beige canvas parasol/umbrella providing shade
- Optional: a camping lantern on the table

INSIDE the tent (visible through open entrance):
- Warm interior lighting (Edison string lights or lanterns)
- Comfortable bedding/cushions visible
- Cozy, inviting atmosphere

ENVIRONMENT: Lush green trees surrounding the gravel area. Mountains in background. Bright daytime, blue sky. Other tents partially visible behind on gravel.

STYLE: Canon EOS R5, 35mm f/2.0. Warm, inviting. Real DSLR photo. NO watermark, NO text. 4K. Portrait orientation.`
  },
  {
    name: "파쇄석 위 텐트 - 여러 동 전경",
    output: "gravel_tent_wide.jpg",
    prompt: `Generate a wide-angle photo showing MULTIPLE beige canvas glamping tents on GRAY CRUSHED GRAVEL ground at a luxury glamping resort.

${TENT_DESC}

SCENE: Wide shot showing 3-4 glamping tents arranged on gray crushed gravel (파쇄석). Tents spaced ~6m apart. Each tent has its entrance facing forward.

IN FRONT OF EACH TENT (on the gravel):
- Wooden folding Kermit chairs (beige canvas)
- Small wooden side table
- Beige parasol/umbrella
- No BBQ here — BBQ is in the canopy zone, not the tent zone

Between tents: crushed gravel pathways. Small trees and landscaping at borders. Grass borders around the gravel edges.

ENVIRONMENT: Korean mountain valley. Lush green mountains. Bright sunny day, blue sky. Clean, premium glamping resort feel.

STYLE: Canon EOS R5, 24mm f/2.8 wide angle. Real DSLR. NO watermark, NO text. 4K. Landscape orientation.`
  },
  {
    name: "파쇄석 위 텐트 - 저녁 분위기",
    output: "gravel_tent_evening.jpg",
    prompt: `Generate a photo of beige canvas glamping tents on gray crushed gravel at a glamping resort during blue hour/evening.

${TENT_DESC}

SCENE: 2-3 glamping tents on crushed gravel during evening twilight. Warm light glows from inside each tent through the canvas walls, creating a beautiful lantern effect. Tent entrances open with warm Edison string lights visible inside.

In front of each tent: wooden chairs, tables with candles/lanterns glowing warmly. STRING LIGHTS hung between trees near the tents.

ENVIRONMENT: Dark mountain silhouettes against deep blue/purple twilight sky. Trees at edges with fairy lights. The warm tent glow against cool blue sky creates a magical atmosphere.

STYLE: Canon EOS R5, 35mm f/1.8. Romantic, cozy. Real DSLR. NO watermark, NO text. 4K. Landscape orientation.`
  }
];

async function enhance(photo) {
  console.log(`\n🎨 [${photo.name}] 생성 중...`);

  const refBuffer = fs.readFileSync(ORIGINAL_REF);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: refBuffer.toString("base64") } },
          { text: `REFERENCE: This image shows the EXACT canopy tent style to use. Generate a NEW photo with this same canopy design on crushed gravel ground.\n\n${photo.prompt}` },
        ],
      }],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          fs.writeFileSync(path.join(OUT_DIR, photo.output), Buffer.from(part.inlineData.data, "base64"));
          console.log(`✅ 저장: ${photo.output}`);
          return true;
        }
        if (part.text) console.log(`📝 ${part.text.substring(0, 200)}`);
      }
    }
    console.log("⚠️ 이미지 없음");
    return false;
  } catch (e) {
    console.error(`❌ ${e.message}`);
    return false;
  }
}

async function main() {
  console.log("🪨 파쇄석 위 캐노피 텐트 이미지 3장 생성");

  let success = 0;
  for (let i = 0; i < photos.length; i++) {
    const ok = await enhance(photos[i]);
    if (ok) success++;
    if (i < photos.length - 1) {
      console.log("⏳ 12초 대기...");
      await new Promise(r => setTimeout(r, 12000));
    }
  }
  console.log(`\n🎉 완료! ${success}/${photos.length}장`);
  console.log(`📁 ${OUT_DIR}`);
}

main();
