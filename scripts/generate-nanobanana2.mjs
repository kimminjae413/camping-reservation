/**
 * 나노바나나2 (Gemini 3.1 Flash Image) 캠핑장 이미지 생성 스크립트
 *
 * 클라이언트 피드백 반영:
 * - 글램핑 X → 오토캠핑장 (개인 텐트/테이블/의자)
 * - 데크존: 잔디 위 나무데크 + 개인텐트
 * - 파쇄석존: 파쇄석 위 + 개인텐트
 * - 밀집 배치 X → 1~2동만, 여유로운 간격
 * - 실제 현장 배경과 일치
 *
 * 사용법: node scripts/generate-nanobanana2.mjs
 */

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// .env 수동 로드
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=["']?(.+?)["']?$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
}

const API_KEY = envVars.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY not found in .env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const ORIGIN_DIR = path.join(__dirname, "..", "images", "origin");
const OUTPUT_DIR = path.join(__dirname, "..", "images", "nanobanana2");

// ─── 공통 스타일 (오토캠핑장) ───
const COMMON_STYLE = `

CRITICAL REQUIREMENTS:
- This is an AUTO CAMPING SITE (오토캠핑장), NOT a glamping resort. NOT a pension. NOT a hotel.
- Campers bring their OWN personal tents, tables, and chairs — NO identical or uniform setups by the campsite operator.
- Each tent should look different (different brands, colors, sizes) — like real campers brought their own gear.
- Sites must have GENEROUS spacing — NOT densely packed. Show empty neighboring sites.
- The surrounding mountain scenery (V-shaped valley, deep green Korean mountains) MUST closely match the reference photo background.
- Modern concrete management building may be visible in background.
- Concrete pathways connecting sites, grass strips as borders between sites.
- Style: Natural, authentic Korean mountain auto-camping — NOT luxury glamping, NOT staged, NOT resort-like.
- Camera: Professional DSLR quality, natural true-to-life colors, no over-saturation.
- NO AI artifacts. Photorealistic. High resolution.
- PRESERVE the exact background mountains, terrain, and structures from the reference photo. Only ADD camping elements to the existing scene.`;

// ─── 데크존 공통 ───
const DECK_ZONE = `
ZONE TYPE - DECK ZONE (데크존):
- IMPORTANT: This is a DEDICATED DECK ZONE — the ENTIRE visible area consists ONLY of grass + wooden deck platforms. NO crushed gravel anywhere in this zone. All neighboring sites in view are also deck sites on grass.
- Ground: Green grass lawn with rectangular WOODEN DECK platforms (나무 데크, warm brown timber)
- The wooden deck is clearly visible — natural wood grain texture
- Tent is pitched ON TOP of the wooden deck platform
- Personal folding camping table and lightweight camping chairs (brought by camper)
- Mature pine trees providing natural shade nearby
- Other deck platforms visible in background but EMPTY (no tents on them)
- Grass between decks is natural, not perfectly manicured
- DO NOT show any gravel/crushed stone ground in this image — this zone is 100% grass + wooden decks`;

// ─── 파쇄석존 공통 ───
const GRAVEL_ZONE = `
ZONE TYPE - GRAVEL ZONE (파쇄석존):
- IMPORTANT: This is a DEDICATED GRAVEL ZONE — the ENTIRE visible area is covered in crushed gravel (파쇄석). NO wooden deck platforms, NO grass lawn in this zone. All neighboring sites in view are also gravel sites.
- Ground: Flat CRUSHED GRAVEL surface (파쇄석) — small gray/white stones covering the entire ground area
- Tent is pitched directly ON the gravel ground
- Personal folding camping table and lightweight camping chairs (brought by camper)
- Wide open gravel area with generous spacing between site boundaries
- Mountain valley clearly visible in the background
- Site boundaries may have small landscaping rocks or low borders
- DO NOT show any wooden deck platforms or grass lawns in this image — this zone is 100% crushed gravel ground`;

// ─── 10장 이미지 프롬프트 정의 ───
const imagePrompts = {
  // ===== A. 데크존 (4장) =====
  "A1_deck_wide_daytime": {
    name: "데크존 전경 (주간)",
    originFile: "KakaoTalk_20260406_230249446_04.jpg",
    prompt: `Using the reference photo as the EXACT background setting, add a natural auto-camping scene to this deck zone.

Place ONE personal dome tent (beige/sand colored, medium size, like a Snowpeak Amenity Dome) on the nearest wooden deck platform. Next to the tent: a small folding camping table with a thermos and cups, two lightweight camping chairs.

The neighboring deck platforms should be COMPLETELY EMPTY — showing this is a spacious campsite with plenty of room.

Far in the background (2-3 sites away), show ONE different-colored tent (olive green, smaller) barely visible — suggesting other campers but far apart.

Bright sunny day, blue sky with a few white clouds. Shot on Canon EOS R5, 24mm wide-angle lens, f/8. Natural daylight, no dramatic color grading.
${DECK_ZONE}${COMMON_STYLE}`
  },

  "A2_deck_closeup_goldenhour": {
    name: "데크존 클로즈업 (골든아워)",
    originFile: "KakaoTalk_20260406_230249446_06.jpg",
    prompt: `Using the reference photo as the EXACT background setting (pine trees, grass, deck platforms, mountains), add a cozy camping scene.

Place ONE living-shell style tent (large beige/khaki tent with front vestibule open, similar to Snowpeak Land Lock style) on one wooden deck platform. In front of the tent vestibule: a wood-top folding table with a small camping lantern, two Helinox-style low chairs facing the mountain view.

Pine tree branches frame the top of the image, creating natural dappled shade.

The adjacent deck is empty. Warm golden hour afternoon light (about 5pm), long soft shadows. Shot on Sony A7IV, 50mm f/1.8 lens. Shallow depth of field with soft bokeh on distant mountains.
${DECK_ZONE}${COMMON_STYLE}`
  },

  "A3_deck_evening": {
    name: "데크존 야간/석양",
    originFile: "KakaoTalk_20260406_230249446_09.jpg",
    prompt: `Using the reference photo's dramatic cloudy mountain backdrop, create an atmospheric evening camping scene.

Place ONE tunnel-style tent (cream/beige, 2-person, with warm interior light glowing through the fabric) on a wooden deck. In front: a low camping table with a warm LED lantern casting golden glow, two chairs.

In the far distance (3+ sites away), ONE other tent with a tiny warm light visible — showing the campsite has a few scattered campers but is not crowded.

Dramatic sunset/dusk sky matching the reference photo's moody clouds. Mountains in silhouette with last golden light. The scene feels peaceful and remote. Shot on Canon EOS R5, 35mm f/2.0 lens. Moody natural light, no artificial staging.
${DECK_ZONE}${COMMON_STYLE}`
  },

  "A4_deck_lifestyle_morning": {
    name: "데크존 라이프스타일 (아침)",
    originFile: "KakaoTalk_20260406_230249446_11.jpg",
    prompt: `Using the reference photo's pathway and mountain view as the EXACT setting, create a peaceful morning camping lifestyle shot.

On the nearest wooden deck: ONE compact dome tent (sage green color) with the rain fly partially rolled back. A camper's chair faces the mountain view. A small table holds a pour-over coffee dripper and enamel mug — morning coffee ritual.

The pathway is clean and inviting. Other deck sites in the background are empty. Fresh morning light, slight mist on the distant mountains. Dewy grass. The feeling: quiet early morning at a mountain campsite before other campers wake up.

Shot on Fujifilm X-T5, 35mm f/2.0 lens. Natural soft morning colors, no heavy editing.
${DECK_ZONE}${COMMON_STYLE}`
  },

  // ===== B. 파쇄석존 (4장) =====
  "B1_gravel_wide_daytime": {
    name: "파쇄석존 전경 (주간)",
    originFile: "KakaoTalk_20260406_230249446.jpg",
    prompt: `Using the reference photo as the EXACT background (pathway, gravel areas, mountains, concrete building), add a natural auto-camping scene to the gravel zone.

Place ONE Nordisk-style A-frame cotton tent (cream/white color, classic triangular shape) on the gravel ground to the right of the pathway. Next to it: a vintage-style wood camping table, two canvas folding chairs, a small tarp/awning extending from the tent for shade.

The gravel ground should look natural — small gray crushed stones clearly visible as the surface texture.

Lots of EMPTY gravel space around the tent. The pathway and other site areas are vacant. Mountain valley view is prominent and matches the reference exactly.

Bright clear day, blue sky. Shot on Canon EOS R5, 24mm wide-angle, f/8. Natural colors.
${GRAVEL_ZONE}${COMMON_STYLE}`
  },

  "B2_gravel_aesthetic_goldenhour": {
    name: "파쇄석존 감성 (골든아워)",
    originFile: "KakaoTalk_20260406_230249446.jpg",
    prompt: `Using the reference photo background, create an aesthetic golden hour camping scene on the gravel zone.

Place ONE bell tent or A-frame tent (warm beige canvas) on the gravel ground. In front: a low wooden camping table with a cutting board and simple food prep (cheese, bread, fruit), two Kermit-style wood chairs. A small portable BBQ grill (Weber Smokey Joe style) sits to the side.

A personal tarp (beige/sand color) extends from one side providing shade over the seating area. The pine tree in the scene provides additional natural framing.

Warm golden afternoon light (about 5:30pm). The gravel catches warm highlights. Mountain scenery glows in the golden hour.

Shot on Sony A7IV, 35mm f/2.0 lens. Warm but natural color temperature.
${GRAVEL_ZONE}${COMMON_STYLE}`
  },

  "B3_gravel_night": {
    name: "파쇄석존 야간",
    originFile: "KakaoTalk_20260406_230249446.jpg",
    prompt: `Using the reference photo's mountain valley setting, create an atmospheric night camping scene on the gravel zone.

Place ONE ridge-style tent (khaki/olive green, 2-3 person) on the gravel ground. Warm light glows from inside the tent. In front: a compact folding table with a warm gas lantern and two low chairs.

Personal string lights (LED, warm white) are strung from the tent to a nearby post or tree — just one strand, personal decoration by the camper.

In the far background, mountain silhouettes against a deep blue twilight sky. ONE other distant tent with a faint warm glow, very far away.

The gravel ground reflects subtle warm light from the lantern. Blue hour atmosphere — deep blue sky with last traces of sunset.

Shot on Canon EOS R5, 35mm f/1.8 lens. Long exposure feel, warm and cool tones balanced naturally.
${GRAVEL_ZONE}${COMMON_STYLE}`
  },

  "B4_gravel_family_evening": {
    name: "파쇄석존 가족 (저녁)",
    originFile: "KakaoTalk_20260406_230249446.jpg",
    prompt: `Using the reference photo background, create a warm family camping evening scene on the gravel zone.

Place ONE large family dome tent (dark khaki/brown, 4-person size, like a Snowpeak Vault) on the gravel. In front: a full-size camping table (folding, aluminum) with a large LED lantern, snacks and drinks on the table. Four camping chairs around the table.

A side tarp extends from the tent creating a covered living space. The setup looks lived-in and natural — not perfectly arranged.

Warm evening light just after sunset. The sky shows beautiful gradient from golden to blue. Mountains in soft silhouette. Empty gravel sites visible on both sides.

Shot on Sony A7IV, 24mm f/2.8 lens. Warm natural evening colors.
${GRAVEL_ZONE}${COMMON_STYLE}`
  },

  // ===== C. 전체 전경/시설 (2장) =====
  "C1_overview_full": {
    name: "캠핑장 전체 뷰",
    originFile: "KakaoTalk_20260406_230249446_10.jpg",
    prompt: `Using this elevated/overview reference photo as the EXACT background, add scattered camping activity to show the campsite in use but NOT crowded.

Add 2-3 tents TOTAL scattered across the visible sites — each a DIFFERENT style and color:
1. On a deck: a beige dome tent (far left area)
2. On gravel: an olive A-frame tent (middle-right area)
3. On a deck: a khaki tunnel tent (far area, small)

All other sites remain EMPTY. The spacing between occupied sites should be large — at least 2-3 empty sites between each tent.

Each tent has a small personal setup (table, chairs) but these are tiny in the overview shot. The concrete building, pathways, and mountain surroundings must match the reference exactly.

Bright daytime, natural light. Shot on Canon EOS R5, 24mm wide-angle, f/11 for maximum sharpness across the scene.
${COMMON_STYLE}`
  },

  "C2_building_with_camp": {
    name: "관리동 + 캠핑 뷰",
    originFile: "KakaoTalk_20260406_230249446_01.jpg",
    prompt: `Using this reference photo of the modern concrete management building as the EXACT setting, show the building with camping activity visible in the background.

The concrete building should remain the primary subject — clean, modern architecture against the mountains.

In the background/distance behind the building, ONE or TWO tents should be barely visible on the camping sites — suggesting the campsite is active but not the focus. Small, subtle — perhaps just tent peaks visible above a wall or through a gap.

Golden hour warm light on the concrete building, making it look warm and inviting. Mountains behind with atmospheric depth. The building should feel like a welcoming campsite reception/facility.

Shot on Sony A7IV, 35mm f/2.0 lens. Architectural photography style with camping context.
${COMMON_STYLE}`
  }
};

// ─── 이미지 로드 헬퍼 ───
function loadImageAsBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString("base64");
}

// ─── 단일 이미지 생성 ───
async function generateImage(outputName, config) {
  const outputPath = path.join(OUTPUT_DIR, `${outputName}.jpg`);

  if (fs.existsSync(outputPath)) {
    console.log(`⏭️  [${config.name}] 이미 생성됨, 스킵`);
    return true;
  }

  console.log(`\n🎨 [${config.name}] 생성 중...`);
  console.log(`   📸 참조: ${config.originFile}`);

  const originPath = path.join(ORIGIN_DIR, config.originFile);
  if (!fs.existsSync(originPath)) {
    console.error(`   ❌ 참조 파일 없음: ${originPath}`);
    return false;
  }

  const base64Image = loadImageAsBase64(originPath);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
            {
              text: config.prompt,
            },
          ],
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // 응답에서 이미지 추출
    if (response.candidates && response.candidates[0]) {
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
          const imageData = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(outputPath, imageData);
          console.log(`   ✅ 저장: ${outputPath}`);
          return true;
        }
      }
    }

    console.log(`   ⚠️  이미지 응답 없음. 텍스트 응답:`);
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) console.log(`   ${part.text.substring(0, 300)}`);
      }
    }
    return false;
  } catch (error) {
    console.error(`   ❌ 에러: ${error.message}`);
    if (error.message.includes("429") || error.message.includes("rate")) {
      console.log("   ⏳ Rate limit 도달. 60초 대기 후 재시도...");
      await new Promise((resolve) => setTimeout(resolve, 60000));
      return generateImage(outputName, config); // 재시도
    }
    return false;
  }
}

// ─── 메인 ───
async function main() {
  console.log("🏕️  나노바나나2 캠핑장 이미지 생성 시작");
  console.log(`   모델: gemini-3.1-flash-image-preview`);
  console.log(`   📂 참조: ${ORIGIN_DIR}`);
  console.log(`   📂 출력: ${OUTPUT_DIR}`);
  console.log(`   📸 총 ${Object.keys(imagePrompts).length}장 생성 예정\n`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const entries = Object.entries(imagePrompts);
  let success = 0;
  let fail = 0;

  for (let i = 0; i < entries.length; i++) {
    const [outputName, config] = entries[i];
    const result = await generateImage(outputName, config);

    if (result) success++;
    else fail++;

    // Rate limit 방지: 각 요청 사이 10초 대기
    if (i < entries.length - 1) {
      console.log("   ⏳ 10초 대기 (Rate limit 방지)...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`🎉 생성 완료! 성공: ${success}장 / 실패: ${fail}장`);
  console.log(`📂 결과: ${OUTPUT_DIR}`);
}

main();
