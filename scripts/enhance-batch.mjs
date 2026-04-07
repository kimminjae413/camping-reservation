/**
 * 00번 + 10번 일괄 향상 - 통일된 캐노피 + 바베큐 세팅
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
const IMG_DIR = path.join(__dirname, "..", "images");
const OUT_DIR = path.join(__dirname, "..", "images", "enhanced");

// ─── 공통 바베큐존 + 캐노피 설정 (모든 사진에 일관 적용) ───
const COMMON_BBQ_CANOPY = `
CONSISTENT BBQ ZONE SETUP (must be identical style across all photos):

LAYOUT ON EACH CONCRETE PAD (two zones):

ZONE 1 — CANOPY/CABANA (MUST cover the ENTIRE concrete pad — VERY IMPORTANT):
- A LARGE SQUARE box-shaped canopy shelter (Classic TP style) — white fabric walls, metal frame, flat roof
- SIZE: The canopy legs/poles are placed at the FOUR CORNERS of the concrete pad. The canopy roof extends from corner to corner. The concrete pad should be almost INVISIBLE because the canopy COMPLETELY covers it. If you can see bare concrete underneath, the canopy is TOO SMALL. The canopy footprint = the concrete pad footprint. 100% coverage.
- Height: tall enough for adults to stand comfortably inside (2.5m+)
- Inside: table and chairs for eating — spacious and comfortable
- Classic TP style: white/cream fabric, sturdy metal frame, side curtains with fringe

ZONE 2 — BBQ GRILLING AREA (OUTSIDE the canopy, on the grass next to the pad):
- A half-drum charcoal BBQ grill (반으로 자른 드럼통 숯불 그릴) — Korean outdoor BBQ style
- ABOVE the grill: a simple TARP (타프) stretched for shade — rectangular fabric tarp held by poles/ropes, casual camping style
- The tarp is just a simple shade cover over the grilling spot, NOT a full enclosed tent
- Slight smoke rising from the grill is fine
- The BBQ area is separate from the cabana because of smoke

GENERAL RULES:
- Keep DAYTIME — bright blue sky, clear sunlight, NO sunset/golden hour
- Must look like a REAL DSLR photograph, NOT AI-generated
- ABSOLUTELY NO watermark, logo, text, or writing on the image
- 4K ultra-high resolution, professional marketing photography
`;

const photos = [
  {
    input: "KakaoTalk_20260406_230249446.jpg",
    output: "KakaoTalk_20260406_230249446_enhanced.jpg",
    name: "00번 - 메인 전경",
    prompt: `Transform this camping site photo into a premium glamping resort marketing image.

CONTEXT:
- Main pathway of glamping resort "더헤이븐리트리" (The Heavenly Tree)
- Concrete rectangular pads on the RIGHT side of the pathway are individual BBQ zones
- "HAVEN" signage wall in background, mountains and blue sky

WHAT TO ADD:
- On each concrete pad: place the canopy tent + BBQ setup as described below
- On ONE pad (the most visible/closest one): show a group of people (3-4 friends/family) — some sitting inside the canopy eating, one person outside grilling meat on the drum BBQ
- Other pads: just the canopy + grill setup without people (ready for guests)
- Enhance landscaping on the left side (trees, flowers) to look pristine
- Grass borders should be vibrant emerald green
- "HAVEN" wall clearly visible
${COMMON_BBQ_CANOPY}`
  },
  {
    input: "KakaoTalk_20260406_230249446_10.jpg",
    output: "KakaoTalk_20260406_230249446_10_enhanced.jpg",
    name: "10번 - 건물 + 바베큐존",
    prompt: `Transform this glamping resort photo into a premium marketing image.

IMPORTANT: The image is rotated 90 degrees clockwise. Fix the rotation to proper upright landscape orientation FIRST.

CONTEXT:
- Glamping resort "더헤이븐리트리" (The Heavenly Tree)
- Concrete building with roof and pillars on the LEFT = staff kitchen + self-bar area
- Concrete square pads on the ground = individual BBQ zones
- "HAVEN" wall in background, mountains

TWO AREAS TO MODIFY:

1. STAFF KITCHEN BUILDING (concrete open structure with pillars):
   - Install modern GLASS WALLS between the concrete pillars
   - Inside should look like a clean professional food prep kitchen where staff cut meat and prepare ingredients
   - Also a self-service bar area visible through the glass
   - Glass should look sleek and modern, fitting the concrete architecture
   - Well-lit, hygienic, professional looking interior

2. BBQ ZONES (concrete pads on the ground):
   - On each pad: place the canopy tent + BBQ setup as described below
   - No people needed, just equipment ready for use
   - Remove the garden hose reel on the grass — keep lawn clean
${COMMON_BBQ_CANOPY}`
  }
];

async function enhance(photo) {
  const inputPath = path.join(IMG_DIR, photo.input);
  const outputPath = path.join(OUT_DIR, photo.output);

  console.log(`\n🎨 [${photo.name}] 처리 중...`);

  const imageBuffer = fs.readFileSync(inputPath);
  const base64Image = imageBuffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: photo.prompt },
          ],
        },
      ],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(outputPath, imageData);
          console.log(`✅ [${photo.name}] 저장 완료`);
          return;
        }
        if (part.text) console.log(`📝 ${part.text.substring(0, 200)}`);
      }
    }
    console.log(`⚠️ [${photo.name}] 이미지 응답 없음`);
  } catch (error) {
    console.error(`❌ [${photo.name}] 에러:`, error.message);
  }
}

async function main() {
  console.log("🏕️ 00번 + 10번 일괄 처리 (캐노피 텐트 + 드럼통 BBQ)");
  for (const photo of photos) {
    await enhance(photo);
    if (photos.indexOf(photo) < photos.length - 1) {
      console.log("⏳ 10초 대기...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  console.log("\n🎉 완료!");
}

main();
