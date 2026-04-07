/**
 * 단일 사진 향상 스크립트 - 00번 (메인 전경 + 바베큐 세팅)
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

const INPUT = path.join(__dirname, "..", "images", "KakaoTalk_20260406_230249446.jpg");
const OUTPUT = path.join(__dirname, "..", "images", "enhanced", "KakaoTalk_20260406_230249446_enhanced.jpg");

const prompt = `Transform this camping site photo into a stunning luxury glamping resort marketing image for Naver Place.

IMPORTANT CONTEXT about this photo:
- This shows the main pathway of a glamping resort called "더헤이븐리트리" (The Heavenly Tree)
- The concrete rectangular pads visible on the RIGHT side of the pathway are INDIVIDUAL BBQ ZONES — each square pad is one private BBQ station
- There is a concrete wall with "HAVEN" signage in the background
- Mountains and blue sky in the backdrop

CRITICAL REQUIREMENT — BBQ SETUP ON EACH PAD:
- On EACH concrete square pad, place a realistic Korean-style BBQ setup:
  - A half-drum BBQ grill (반으로 자른 드럼통 숯불 그릴) — the classic Korean outdoor charcoal BBQ style
  - Charcoal fire burning inside the drum grill with slight smoke rising
  - A folding table with camping chairs around it
  - On ONE of the pads (the closest/most visible one), show a group of people (a family or friends, 3-4 people) actively using the BBQ — sitting around, grilling meat, enjoying the meal together. They should look natural and happy.
  - The other pads should have the drum grill + table/chair setup but without people (ready for use)
  - IMPORTANT: Each BBQ pad should have a canvas/fabric tent canopy roof (천막 지붕) over it — like a simple A-frame or flat canvas shade structure covering the BBQ area to provide shade. The canopy should be beige/khaki colored fabric, supported by metal poles. Think of a simple outdoor market-style canvas roof or a camping tarp shelter over each pad.
  - Keep setups realistic and proportional to pad size

PHOTO ENHANCEMENT:
- IMPORTANT: Keep the DAYTIME setting — bright blue sky, midday/afternoon sunlight, just like the original photo
- Do NOT add sunset, golden hour, or orange sky. Keep the clear blue sky from the original.
- Shot on Canon EOS R5 with 24mm f/2.8 wide-angle lens
- Enhance the lush green mountains with rich, vivid tones
- Make the grass borders vibrant emerald green, perfectly manicured
- Keep the bright, clear blue sky — enhance it slightly for more vivid blue
- The "HAVEN" wall should be clearly visible and clean
- Left side: enhance the landscaping (trees, flowers) to look pristine
- Enhance overall sharpness, color vibrancy, and clarity
- 4K ultra-high resolution, professional travel magazine photography
- Must look like a REAL DSLR photograph, NOT AI-generated
- This is for Naver Place marketing — must look inviting and lively
- ABSOLUTELY NO watermark, logo, text overlay, or any writing on the image. The image must be completely clean with zero text.`;

async function run() {
  console.log("🎨 00번 사진 향상 중 (바베큐 세팅 반영)...");

  const imageBuffer = fs.readFileSync(INPUT);
  const base64Image = imageBuffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: prompt },
          ],
        },
      ],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(OUTPUT, imageData);
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
