/**
 * 공사현장 → 완성된 글램핑장 변환 (2장)
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

// 파쇄석 레퍼런스 이미지도 함께 전송
const GRAVEL_REF = "C:\\Users\\김민재\\Desktop\\클로드스크린샷\\파쇄석.jpg";

const photos = [
  {
    name: "현장3 - 위에서 내려다본 전경",
    input: "C:\\Users\\김민재\\Desktop\\클로드스크린샷\\실제3.png",
    output: "construction_3_completed.jpg",
    prompt: `Transform this construction site photo into a COMPLETED luxury glamping resort.

THIS IS A BEFORE → AFTER transformation. The photo shows a bare dirt construction site on a hillside with mountains behind it. Transform it into the finished glamping resort "더헤이븐리트리".

REMOVE completely:
- The white/blue container box (construction office)
- The black car
- All construction materials, wooden pallets, rocks piled up
- All people
- All dirt/mud — replace with finished ground

REPLACE THE DIRT GROUND WITH:
- Gray crushed gravel (파쇄석) covering the entire flat area — this is the second reference image showing what the gravel looks like (gray/blue crushed stone, 2-3cm pieces)
- On top of the gravel: place 4-6 rectangular CONCRETE DECK PADS (about 5m x 5m each) arranged in a neat grid pattern with gravel between them
- Between and around the pads: clean crushed gravel ground
- Add neat GRASS borders along the edges and between sections
- Add a concrete PATHWAY connecting the pads

KEEP:
- The mountain backdrop exactly as-is — the beautiful green valley view
- The general terrain/slope of the land
- The concrete wall/barrier on the left edge
- Trees on the right side

ADD:
- Clean, manicured landscaping (some small trees, shrubs)
- The overall look should match the other photos of this resort (clean concrete pads on gravel with grass borders)

RULES:
- Keep daytime, bright blue sky
- Must look like a REAL DSLR photograph
- NO watermark, NO text
- 4K resolution
- This should look like a premium glamping resort site ready for guests`
  },
  {
    name: "현장4 - 아래에서 올려다본 전경",
    input: "C:\\Users\\김민재\\Desktop\\클로드스크린샷\\실제4.png",
    output: "construction_4_completed.jpg",
    prompt: `Transform this construction site photo into a COMPLETED luxury glamping resort.

THIS IS A BEFORE → AFTER transformation. The photo shows a bare dirt/grass construction site with mountains behind it and a container building on the right. Transform it into the finished glamping resort "더헤이븐리트리".

REMOVE completely:
- The white container building on the right
- The person walking
- The cars in the background
- All construction materials, rock piles
- The fence/barrier on the left
- All bare dirt — replace with finished ground

REPLACE WITH:
- Gray crushed gravel (파쇄석) covering the flat area — same gray/blue crushed stone as the second reference image
- On top of the gravel: 4-6 rectangular CONCRETE DECK PADS (about 5m x 5m each) arranged neatly
- Clean crushed gravel between the pads
- Neat GRASS borders and landscaping around the edges
- A concrete PATHWAY

KEEP:
- The mountain backdrop exactly as-is — the beautiful green mountains with clouds
- The general terrain shape
- The trees and vegetation on edges

ADD:
- Clean, manicured landscaping
- The overall look should match a premium glamping resort

RULES:
- Keep daytime, bright blue sky with clouds (same as original)
- Must look like a REAL DSLR photograph
- NO watermark, NO text
- 4K resolution`
  }
];

async function enhance(photo) {
  console.log(`\n🎨 [${photo.name}] 처리 중...`);

  const imageBuffer = fs.readFileSync(photo.input);
  const base64Image = imageBuffer.toString("base64");

  // 파쇄석 레퍼런스도 읽기
  let gravelParts = [];
  try {
    const gravelBuffer = fs.readFileSync(GRAVEL_REF);
    gravelParts = [{ inlineData: { mimeType: "image/jpeg", data: gravelBuffer.toString("base64") } }];
  } catch(e) {
    // 파쇄석 파일명이 다를 수 있음
    console.log("⚠️ 파쇄석 레퍼런스 파일 못 찾음, 텍스트만으로 진행");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/png", data: base64Image } },
          ...gravelParts,
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
  console.log("🏗️ → 🏕️ 공사현장 → 완성 글램핑장 변환");
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
