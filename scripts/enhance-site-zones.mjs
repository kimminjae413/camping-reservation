/**
 * 공사현장 → 완성 사이트 (두 영역: 한가족/두가족 구분)
 * 빨간색(오른쪽): 한가족 — 티피텐트 + 우드데크 + 화로대 + 파쇄석
 * 파란색(왼쪽): 두가족 — 큰 벨텐트 + 우드데크 + 잔디
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

// 레퍼런스 이미지들
const refs = {
  oneFamily: "C:\\Users\\김민재\\Desktop\\클로드스크린샷\\한가족레퍼런스.png",
  gravel: "C:\\Users\\김민재\\Desktop\\클로드스크린샷\\파쇄석참조.png",
};

function loadRef(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return { inlineData: { mimeType: "image/png", data: buf.toString("base64") } };
  } catch(e) { return null; }
}

const INPUT = "C:\\Users\\김민재\\Desktop\\클로드스크린샷\\실제4.png";
const OUTPUT = path.join(OUT_DIR, "construction_4_completed.jpg");

const prompt = `Transform this construction site photo into a COMPLETED luxury glamping resort with TWO distinct zones.

IMPORTANT: The photo shows a bare dirt hillside construction site viewed from above, with mountains behind. Remove ALL construction items (container, cars, people, rocks, materials, fence).

THE SITE HAS TWO ZONES divided by a central pathway:

ZONE 1 — LEFT SIDE (파란색/Blue zone) — "두가족" TWO-FAMILY GLAMPING:
- 4-5 LARGE bell tents (큰 벨텐트) — cream/white canvas, classic glamping bell tent shape
- Each bell tent sits on its own WOODEN DECK platform
- The bell tents are BIG (can fit 4-6 people) — like the large safari/bell tents in luxury glamping resorts
- GREEN GRASS between the tents, with small pathways connecting them
- Each tent area has outdoor seating/furniture visible
- This zone feels spacious, green, pastoral — like the reference image of multiple bell tents on a hillside

ZONE 2 — RIGHT SIDE (빨간색/Red zone) — "한가족" ONE-FAMILY GLAMPING:
- 3-4 TIPI/TEEPEE tents (티피텐트) — white canvas, pointed conical shape
- Each tipi on its own WOODEN DECK platform
- In front of each tipi: a FIRE PIT (화로대) + 2 round rattan/acapulco chairs
- Ground between tipis: GRAY CRUSHED GRAVEL (파쇄석) instead of grass
- This zone feels more intimate, individual, cozy
- Reference: the second image shows exactly this style — tipi + wood deck + chairs + fire pit

BETWEEN THE ZONES:
- A concrete or gravel PATHWAY running through the center
- Some landscaping: young trees, shrubs, grass borders
- Natural transition from grass (left) to gravel (right)

KEEP: Mountain valley backdrop exactly as original, terrain slope, surrounding trees

RULES:
- Daytime, bright sky with clouds (same as original photo)
- Must look like a REAL drone/aerial photograph
- NO watermark, NO text, NO logo
- 4K resolution
- The overall feel: premium mountain glamping resort with two distinct experiences`;

async function run() {
  console.log("🏕️ 두 영역 사이트 생성 (한가족 + 두가족)...");

  const imageBuffer = fs.readFileSync(INPUT);
  const base64Image = imageBuffer.toString("base64");

  // 레퍼런스 이미지 로드
  const refParts = [];
  const oneRef = loadRef(refs.oneFamily);
  const gravRef = loadRef(refs.gravel);
  if (oneRef) refParts.push(oneRef);
  if (gravRef) refParts.push(gravRef);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/png", data: base64Image } },
          ...refParts,
          { text: prompt + "\n\nThe additional images are references: Image 2 = one-family tipi style (for right zone), Image 3 = gravel ground + safari tent style (for right zone ground material)." },
        ],
      }],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          fs.writeFileSync(OUTPUT, Buffer.from(part.inlineData.data, "base64"));
          console.log("✅ 저장 완료:", OUTPUT);
          return;
        }
        if (part.text) console.log(`📝 ${part.text.substring(0, 300)}`);
      }
    }
    console.log("⚠️ 이미지 없음");
  } catch (e) { console.error("❌", e.message); }
}

run();
