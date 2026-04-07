/**
 * 공사현장 → 데크 + 파쇄석만 설치된 상태 (건물 없음)
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

// 완성된 사이트 사진을 레퍼런스로 함께 보냄 (데크+파쇄석 느낌 참고)
const SITE_REF = path.join(__dirname, "..", "images", "KakaoTalk_20260406_230249446.jpg");

const COMMON = `
WHAT TO DO:
- Remove ALL construction items: container box, cars, people, rock piles, wooden pallets, fence, bare dirt
- Replace the bare dirt ground with:
  1. Gray crushed gravel (파쇄석) covering the entire flat area — small gray/blue crushed stones 2-3cm
  2. Rectangular WOODEN DECK platforms (about 5m x 5m each) made of warm brown natural wood planks, placed on top of the gravel, arranged in a neat grid
  3. Green GRASS borders between the gravel areas and along edges
  4. A concrete PATHWAY running through the site
- NO BUILDINGS — just the empty prepared site with decks and gravel
- NO tents, NO canopies, NO furniture — completely empty decks ready for future construction
- Add some small landscaping: young trees, shrubs along the borders
- The third reference image shows what the finished deck+gravel site looks like from another angle

KEEP: Mountain backdrop, terrain slope, trees on edges, sky

RULES:
- Daytime, same lighting as original
- Must look like a REAL photograph of a prepared construction site
- NO watermark, NO text
- 4K resolution`;

const photos = [
  {
    name: "현장3 - 정면뷰",
    input: "C:\\Users\\김민재\\Desktop\\클로드스크린샷\\실제3.png",
    output: "construction_3_completed.jpg",
    prompt: `Transform this construction site into a PREPARED glamping site with only concrete decks and crushed gravel installed. NO buildings.
${COMMON}`
  },
  {
    name: "현장4 - 조감뷰",
    input: "C:\\Users\\김민재\\Desktop\\클로드스크린샷\\실제4.png",
    output: "construction_4_completed.jpg",
    prompt: `Transform this construction site (viewed from above) into a PREPARED glamping site with only concrete decks and crushed gravel installed. NO buildings.
${COMMON}`
  }
];

async function enhance(photo) {
  console.log(`\n🎨 [${photo.name}] 처리 중...`);
  const imageBuffer = fs.readFileSync(photo.input);
  const base64Image = imageBuffer.toString("base64");

  const refParts = [];
  try {
    const buf = fs.readFileSync(SITE_REF);
    refParts.push({ inlineData: { mimeType: "image/jpeg", data: buf.toString("base64") } });
  } catch(e) {}

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/png", data: base64Image } },
          ...refParts,
          { text: photo.prompt },
        ],
      }],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          fs.writeFileSync(path.join(OUT_DIR, photo.output), Buffer.from(part.inlineData.data, "base64"));
          console.log(`✅ 저장 완료`);
          return;
        }
        if (part.text) console.log(`📝 ${part.text.substring(0, 200)}`);
      }
    }
    console.log("⚠️ 이미지 없음");
  } catch (e) { console.error("❌", e.message); }
}

async function main() {
  console.log("🏗️ → 데크 + 파쇄석만 설치");
  for (let i = 0; i < photos.length; i++) {
    await enhance(photos[i]);
    if (i < photos.length - 1) {
      console.log("⏳ 10초 대기...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  console.log("\n🎉 완료!");
}
main();
