/**
 * 텐트 내부 2가지 컨셉 생성 (원본 없이 새로 생성)
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

const concepts = [
  {
    name: "로우 스타일 (낮은 캠핑 로우체어 + 로우테이블)",
    output: "tent_interior_low_table.jpg",
    prompt: `Generate a photorealistic interior photo taken inside a SQUARE canopy shelter at a glamping BBQ zone.

CANOPY SHELTER (CRITICAL — reference: Classic TP brand glamping canopy):
- SQUARE/RECTANGULAR box-shaped canopy — like the white square cabana tents from Classic TP Customizing brand
- White/cream fabric walls with metal frame, FLAT or very slightly peaked roof
- Side curtains: one side fully open showing green mountains outside, other sides have white fabric curtains (some tied back)
- There may be decorative curtain fringe/tassels on the edges like in Classic TP products
- Ceiling height about 2.2m, shelter size roughly 3m x 3m — intimate, not huge
- Floor is a concrete pad
- The overall look should match the Classic TP glamping cabana product photos — elegant white fabric shelter

FURNITURE — FLOOR-LEVEL seating (this is the KEY difference from the other style):
- A wooden table that is only 25cm tall — barely off the ground, like a Japanese kotatsu or Korean 좌식 table
- Instead of chairs: FLOOR CUSHIONS or very low bean-bag style seats (max 15cm off ground) arranged around the table
- People using this setup would sit CROSS-LEGGED or with legs stretched under the table
- The eye level of a seated person would be around 80-90cm from the ground
- Compare: the OTHER style has 70cm table + 45cm chairs. THIS style has 25cm table + floor cushions.
- Dark rattan/wicker material, with RED accent cushions
- The table is EMPTY — no food, just clean empty table
- A hanging lantern from the center pole

ATMOSPHERE & FORMAT:
- VERTICAL/PORTRAIT photo orientation (3:4 ratio — taller than wide)
- Bright daytime, natural sunlight through the open side
- Luxurious glamping feel — like a resort cabana
- Shot on Canon EOS R5 with 35mm f/2.0 lens, PORTRAIT orientation
- 4K ultra-high resolution, REAL photograph look
- ABSOLUTELY NO watermark, logo, text on the image`
  },
  {
    name: "미드 스타일 (중간 높이 접이식 캠핑 테이블 + 의자)",
    output: "tent_interior_mid_table.jpg",
    prompt: `Generate a photorealistic interior photo taken inside a SQUARE canopy shelter at a glamping BBQ zone.

CANOPY SHELTER (MUST be identical to the low-style version — same tent):
- SQUARE/RECTANGULAR box-shaped canopy — Classic TP Customizing brand style
- White/cream fabric walls with metal frame, FLAT or very slightly peaked roof
- Side curtains: one side fully open showing green mountains, others with white fabric curtains tied back
- Decorative curtain fringe/tassels on edges
- Ceiling height about 2.2m, shelter roughly 3m x 3m
- Floor is a concrete pad

FURNITURE — STANDARD HEIGHT dining seating:
- Red or warm-toned metal/outdoor CHAIRS with armrests (~45cm seat height, standard chair)
- A round DINING TABLE at standard dining height (~70cm)
- 4-6 chairs around the table — matching style, clean look
- The table is EMPTY — no food, no dishes, just a clean empty table ready for guests

ATMOSPHERE & FORMAT:
- VERTICAL/PORTRAIT photo orientation (3:4 ratio — taller than wide, like a phone camera photo)
- Bright daytime, natural sunlight coming through the open side
- Luxurious glamping feel — like a resort cabana dining area
- Shot on Canon EOS R5 with 35mm f/2.0 lens, PORTRAIT orientation
- 4K ultra-high resolution, must look like a REAL photograph
- ABSOLUTELY NO watermark, logo, text on the image`
  }
];

async function generate(concept) {
  const outputPath = path.join(OUT_DIR, concept.output);
  console.log(`\n🎨 [${concept.name}] 생성 중...`);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ parts: [{ text: concept.prompt }] }],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(outputPath, imageData);
          console.log(`✅ [${concept.name}] 저장 완료`);
          return;
        }
        if (part.text) console.log(`📝 ${part.text.substring(0, 200)}`);
      }
    }
    console.log(`⚠️ [${concept.name}] 이미지 응답 없음`);
  } catch (error) {
    console.error(`❌ [${concept.name}] 에러:`, error.message);
  }
}

async function main() {
  console.log("🏕️ 텐트 내부 2가지 컨셉 생성");
  for (let i = 0; i < concepts.length; i++) {
    await generate(concepts[i]);
    if (i < concepts.length - 1) {
      console.log("⏳ 10초 대기...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  console.log("\n🎉 완료!");
}

main();
