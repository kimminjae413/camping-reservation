/**
 * 시멘트 데크 앞 조명 설치 - Gemini 이미지 편집
 * 원본 사진을 최대한 유지하면서 조명만 추가
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

// 원본 사진
const ORIGINAL = path.join(__dirname, "..", "images", "KakaoTalk_20260406_230249446.jpg");
// 조명 레퍼런스
const LIGHTING_REF = "C:\\Users\\김민재\\Desktop\\클로드스크린샷\\조명레퍼런스.png";
// 출력
const OUTPUT = path.join(__dirname, "..", "images", "enhanced", "lighting_installed.jpg");

const prompt = `This is a photo editing task. You MUST preserve the original photo as much as possible.

I repeat: DO NOT regenerate or reimagine this photo. Treat this like Photoshop — paint ONLY the small additions described below onto the existing image. Every pixel that is not part of the additions must remain UNCHANGED from the original.

The photo shows a glamping resort pathway. On the RIGHT side there are WHITE CANVAS CANOPY TENTS over grass decks — a couple is having BBQ under one. On the LEFT side there are flower beds and landscaping. A concrete pathway runs down the center. Mountains and blue sky in the back.

YOUR ONLY JOB — Add these small items on the GROUND only:
1. Along the left edge of the concrete pathway (where pathway meets the flower beds): place 5-6 small black 지중등 (in-ground flush lights, ~10cm diameter circles) spaced ~1.5m apart on the ground
2. Near 2-3 of the larger shrubs/trees on the left: place small black cylindrical 수목투사등 (ground spotlights, ~15cm tall) aimed at the plants

That's it. Just tiny black fixtures on the ground. Nothing else changes.

DO NOT:
- Change the sky, mountains, or lighting conditions
- Remove, modify, or reshape the white tent canopies in ANY way
- Remove or move the people or BBQ
- Add any new structures, decks, or architectural elements
- Change the grass, pathway, or any surface
- Change the time of day — keep it bright daytime

The output must look 99% identical to the input. Only difference: small dark lighting fixtures visible on the ground near the pathway edge and flower beds.

NO watermark, NO text.`;

async function run() {
  console.log("💡 조명 설치 이미지 생성 중 (원본 보존 모드)...");

  const originalBuffer = fs.readFileSync(ORIGINAL);
  const base64Original = originalBuffer.toString("base64");

  let refParts = [];
  try {
    const refBuffer = fs.readFileSync(LIGHTING_REF);
    refParts = [{ inlineData: { mimeType: "image/png", data: refBuffer.toString("base64") } }];
    console.log("✅ 조명 레퍼런스 이미지 로드 완료");
  } catch (e) {
    console.log("⚠️ 조명 레퍼런스 파일 못 찾음, 텍스트만으로 진행");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Original } },
          ...refParts,
          { text: prompt },
        ],
      }],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const outDir = path.dirname(OUTPUT);
          if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
          fs.writeFileSync(OUTPUT, Buffer.from(part.inlineData.data, "base64"));
          console.log(`✅ 저장 완료: ${OUTPUT}`);
          return;
        }
        if (part.text) console.log(`📝 텍스트 응답: ${part.text.substring(0, 300)}`);
      }
    }
    console.log("⚠️ 이미지 응답 없음");
  } catch (error) {
    console.error("❌ 에러:", error.message);
  }
}

run();
