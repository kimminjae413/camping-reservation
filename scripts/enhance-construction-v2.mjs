/**
 * 공사현장 → 완성된 글램핑 리조트 (건물 유닛 배치)
 * PDF 설계도 기반: A동(45㎡), B동/HAVEN(70㎡), C동(85㎡), 관리동(100㎡)
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

// 배치도 + A UNIT 렌더링을 레퍼런스로 함께 보냄
const LAYOUT_REF = path.join(__dirname, "..", "images", "pdf_page_18.png");
const UNIT_REF = path.join(__dirname, "..", "images", "pdf_page_24.png");

const COMMON_BUILDING_DESC = `
BUILDING UNITS TO PLACE ON THE SITE (from architectural plans):

All buildings share these characteristics:
- Modern concrete/exposed concrete walls
- GABLE ROOF (박공지붕) — triangular peaked roof shape, NOT flat
- Skylights/clerestory windows (천창) on the roof ridge letting in natural light
- Wood truss ceiling structure visible inside
- Large glass windows/doors
- Minimalist, modern Korean architecture style — similar to HAVEN brand

SPECIFIC UNITS:
1. A UNIT (45㎡, 13평) — Small 2-person cabin, single story with loft feeling, skylight on roof
2. B UNIT / HAVEN (70㎡, 21평) — Medium 2-person cabin, duplex/복층 structure, taller
3. C UNIT (85㎡, 25평) — Large 4-person cabin, most spacious
4. INFORMATION / 관리동 (100㎡, 30평) — Reception/management building, slightly different design

SITE LAYOUT:
- Buildings arranged on the hillside terrain with spacing between them
- Gray crushed gravel (파쇄석) ground between and around buildings
- Concrete pathways connecting the buildings
- Grass landscaping borders and small trees/shrubs
- Each building has its own small outdoor deck area
`;

const photos = [
  {
    name: "현장3 - 위에서 내려다본 전경",
    input: "C:\\Users\\김민재\\Desktop\\클로드스크린샷\\실제3.png",
    output: "construction_3_completed.jpg",
    prompt: `Transform this construction site photo into a COMPLETED luxury glamping resort with buildings.

The photo shows a bare dirt hillside construction site viewed from ground level, with mountains behind it. This is the "추가 계획 부지" (additional planned site) of approximately 2,500㎡.

REMOVE: container box, cars, person, all construction materials, rock piles, fence, bare dirt

PLACE ON THIS SITE:
${COMMON_BUILDING_DESC}

ARRANGEMENT for this view angle:
- Place 2-3 cabin buildings (A and B units) visible in the mid-ground, spaced apart on the hillside
- The Information/관리동 building could be at the entrance area (lower/closer to viewer)
- Buildings should follow the natural slope of the terrain
- Fill the ground with gray crushed gravel (파쇄석) and concrete pathways
- Add grass borders, landscaping, small trees between buildings

KEEP: Mountain backdrop, general terrain slope, trees on edges, blue sky with clouds

RULES:
- Daytime, same lighting as original
- Must look like a REAL architectural photograph / resort marketing photo
- NO watermark, NO text
- 4K resolution
- Buildings must have gable/peaked roofs with concrete walls — modern minimalist Korean architecture`
  },
  {
    name: "현장4 - 위에서 내려다본 전경 (조감)",
    input: "C:\\Users\\김민재\\Desktop\\클로드스크린샷\\실제4.png",
    output: "construction_4_completed.jpg",
    prompt: `Transform this construction site photo into a COMPLETED luxury glamping resort viewed from above.

The photo shows a bare dirt hillside construction site viewed from an elevated position looking down, with a mountain valley behind. This is the "추가 계획 부지" of approximately 2,500㎡.

REMOVE: container box, cars, person, all construction materials, rock piles, bare dirt, wooden pallets

PLACE ON THIS SITE:
${COMMON_BUILDING_DESC}

ARRANGEMENT for this bird's-eye view:
- Show 3-4 cabin buildings (mix of A, B, C units) arranged across the hillside
- Each building clearly visible from above with their gable/peaked roofs
- The roofs should be visible — dark gray or natural material
- Buildings spaced apart with crushed gravel ground between them
- Concrete pathways connecting all buildings
- Information/관리동 near the entrance/road area
- Grass landscaping, small trees, shrubs around buildings
- The concrete wall/barrier on the left edge stays

KEEP: Mountain valley backdrop, village below, terrain slope, trees on edges

RULES:
- Daytime, same lighting as original
- Must look like a REAL aerial/drone photograph of a completed resort
- NO watermark, NO text
- 4K resolution
- This should look like a premium mountain glamping resort with modern architecture`
  }
];

async function enhance(photo) {
  console.log(`\n🎨 [${photo.name}] 처리 중...`);

  const imageBuffer = fs.readFileSync(photo.input);
  const base64Image = imageBuffer.toString("base64");

  // 레퍼런스 이미지들 (배치도 + 유닛 렌더링)
  const refParts = [];
  for (const refPath of [LAYOUT_REF, UNIT_REF]) {
    try {
      const buf = fs.readFileSync(refPath);
      refParts.push({ inlineData: { mimeType: "image/png", data: buf.toString("base64") } });
    } catch(e) {}
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/png", data: base64Image } },
          ...refParts,
          { text: photo.prompt + "\n\nThe second and third images are architectural reference: site layout plan and A UNIT interior rendering. Use these to understand the building style." },
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
  console.log("🏗️ → 🏕️ 공사현장 → 완성 글램핑 리조트 (건물 유닛 배치)");
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
