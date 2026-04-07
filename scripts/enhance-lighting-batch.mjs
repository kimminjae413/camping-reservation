/**
 * 원본 캐노피 기반 저녁 조명 컨셉 사진 5장 배치 생성
 * 원본의 흰색 사각 캐노피 텐트 스타일을 유지하면서
 * 레퍼런스 사진들과 같은 저녁 조명 분위기로 다양한 앵글 생성
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

// 원본 (캐노피 스타일 참고용)
const ORIGINAL = path.join(__dirname, "..", "images", "enhanced", "KakaoTalk_20260406_230249446_enhanced.jpg");
const OUT_DIR = path.join(__dirname, "..", "images", "enhanced");

// 캐노피 상세 설명 (모든 프롬프트에 공통 적용)
const CANOPY_DESC = `The canopy tents in this glamping resort are: white/cream colored rectangular cabana-style canopy structures with metal frames (silver/white poles), sheer white curtains hanging from all sides, flat or slightly angled fabric roof. Each canopy covers a concrete deck pad on green grass. Inside each canopy: wooden folding table, camping chairs, warm ambient lighting. These are NOT A-frame tents, NOT triangular — they are RECTANGULAR CABANA canopies with curtains, exactly like luxury poolside cabanas.`;

const SITE_DESC = `The glamping resort "더헤이븐리트리" (The Heavenly Tree) features: a central concrete pathway, multiple white rectangular cabana canopies in a row on one side, landscaped flower beds on the other side, a concrete wall with "HAVEN" signage, lush green mountains as backdrop, gray gravel/crushed stone ground between the grass areas.`;

const photos = [
  {
    name: "01 - 단일 캐노피 클로즈업 (저녁)",
    output: "concept_01_single_canopy_evening.jpg",
    prompt: `Generate a photo of a single white rectangular cabana canopy tent at a luxury glamping resort during blue hour (dusk/evening).

${CANOPY_DESC}

SCENE: Close-up view of ONE canopy from slightly outside, looking in at an angle. Inside the canopy: a wooden folding table set with food and drinks, warm Edison-bulb string lights draped inside the canopy frame creating a golden glow. A small black BBQ grill (Weber kettle style) sits just outside the canopy on the gravel ground. The canopy curtains are partially open, revealing the cozy interior.

ENVIRONMENT: Gray crushed gravel ground. Green grass border around the concrete deck. Mountains visible in the background as dark silhouettes against a blue-purple twilight sky. Other canopies visible in the background, also glowing warmly.

LIGHTING: Blue hour sky. Warm 2700K Edison string lights inside canopy. Soft warm glow spilling out onto the ground.

STYLE: Shot on Canon EOS R5, 35mm f/1.8, shallow depth of field. Real DSLR photograph quality. NO watermark, NO text. 4K.`
  },
  {
    name: "02 - 전체 전경 스트링라이트 (저녁)",
    output: "concept_02_panorama_stringlights.jpg",
    prompt: `Generate a wide panoramic photo of a luxury glamping resort at dusk with beautiful string lights.

${CANOPY_DESC}
${SITE_DESC}

SCENE: Wide shot showing 4-5 white rectangular cabana canopies in a row along a concrete pathway. Between the canopy poles and across the pathway, WARM STRING LIGHTS (줄조명, Edison bulb style) are strung in gentle drooping lines connecting each canopy to the next. The string lights create a magical warm canopy of light over the pathway.

Trees near the pathway are wrapped with warm LED fairy lights (나무 줄조명), creating a sparkling effect. Each canopy glows warmly from inside with ambient lighting.

ENVIRONMENT: Concrete pathway in center, canopies on right side, flower beds and landscaped shrubs on left. Mountains as dark silhouettes. Blue-purple twilight sky. Gray gravel ground.

LIGHTING: The dominant light sources are the warm string lights and canopy interior glow. Blue hour ambient light in the sky. Creates a romantic, inviting atmosphere.

STYLE: Shot on Canon EOS R5, 24mm f/2.8 wide angle. Real DSLR photograph. NO watermark, NO text. 4K.`
  },
  {
    name: "03 - 나무 사이로 본 캐노피 2동 (저녁)",
    output: "concept_03_through_trees.jpg",
    prompt: `Generate a photo looking through trees at two white rectangular cabana canopies at a glamping resort during evening twilight.

${CANOPY_DESC}

SCENE: Camera is positioned on the landscaped side (left side of the pathway), shooting through small ornamental trees and shrubs toward TWO adjacent canopy tents. The trees in the foreground have warm fairy lights (LED 줄조명) wrapped around their trunks and branches, creating a sparkling frame for the canopies behind.

Both canopies glow warmly from within — you can see the warm Edison string lights inside and the silhouettes of furniture. The white curtains are partially drawn, with golden light spilling through.

Between the two canopies, a grass area with small bollard garden lights (잔디등).

ENVIRONMENT: Gravel pathway visible. Green grass areas. Mountains and twilight sky in background. Natural landscaping with rocks and shrubs.

LIGHTING: Warm fairy lights on trees in foreground. Warm glow from both canopies. Blue hour sky. Subtle ground lighting between tents.

STYLE: Shot on Canon EOS R5, 50mm f/1.4, cinematic depth of field. Foreground tree slightly soft/bokeh. Real DSLR photo. NO watermark, NO text. 4K.`
  },
  {
    name: "04 - 원거리 전경 파노라마 (저녁)",
    output: "concept_04_distant_panorama.jpg",
    prompt: `Generate a distant wide-angle panoramic photo of the entire glamping resort at dusk, showing the full site layout.

${CANOPY_DESC}
${SITE_DESC}

SCENE: Shot from a slightly elevated position showing the ENTIRE resort layout. 5-6 white rectangular cabana canopies are visible in a row, each glowing warmly from interior lighting. String lights (warm Edison bulbs) connect between canopies and along the pathway, creating lines of warm light dots across the scene.

The concrete pathway runs through the center. The concrete "HAVEN" wall is visible. The landscaped area with trees (some wrapped in fairy lights) is on the left side.

A few people/silhouettes are visible near the canopies, enjoying the evening.

ENVIRONMENT: Full mountain panorama as dark silhouettes against gradient twilight sky (deep blue at top fading to purple/orange near horizon). The entire gravel ground area visible. Grass borders and landscaping.

LIGHTING: Multiple warm light sources — canopy interiors, string lights, tree fairy lights, subtle ground lights. Blue hour ambient sky. The contrast between warm ground lights and cool sky creates a dramatic atmosphere.

STYLE: Shot on Canon EOS R5, 16mm f/4 ultra-wide. Real DSLR photograph. NO watermark, NO text. 4K.`
  },
  {
    name: "05 - 캐노피 내부에서 밖을 바라본 뷰 (저녁)",
    output: "concept_05_inside_looking_out.jpg",
    prompt: `Generate a photo taken from INSIDE a white rectangular cabana canopy looking outward at the glamping resort during evening.

${CANOPY_DESC}

SCENE: Camera is positioned inside one of the canopies, looking out through the partially open white curtains toward the pathway and mountains.

FOREGROUND (inside canopy): Wooden folding table with wine glasses, a cheese/fruit board, and warm candles. Warm Edison string lights visible above, attached to the canopy frame. The white curtains frame the view like a natural vignette on left and right edges.

MIDDLE GROUND (outside): The concrete pathway and other canopies visible across the way, each glowing warmly. String lights connecting the canopies. A BBQ grill nearby.

BACKGROUND: Mountain silhouettes against beautiful blue-purple twilight sky with a few stars beginning to appear.

LIGHTING: Warm candle light and string lights inside create a cozy intimate feel. Other canopies glow in the distance. Blue hour sky provides beautiful contrast.

STYLE: Shot on Canon EOS R5, 24mm f/1.4, real DSLR. Warm, inviting, romantic atmosphere. Like a luxury resort promotional photo. NO watermark, NO text. 4K.`
  }
];

async function enhance(photo) {
  console.log(`\n🎨 [${photo.name}] 생성 중...`);

  // 원본을 스타일 참고용으로 전송
  const originalBuffer = fs.readFileSync(ORIGINAL);
  const base64Original = originalBuffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Original } },
          { text: `REFERENCE: The first image shows the EXACT style of canopy tents used at this resort. Your generated image MUST use this SAME canopy design — white rectangular cabana with metal frame and curtains. Do NOT use A-frame tents, triangular tents, or any other tent style.\n\n${photo.prompt}` },
        ],
      }],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          fs.writeFileSync(path.join(OUT_DIR, photo.output), Buffer.from(part.inlineData.data, "base64"));
          console.log(`✅ 저장 완료: ${photo.output}`);
          return true;
        }
        if (part.text) console.log(`📝 ${part.text.substring(0, 200)}`);
      }
    }
    console.log("⚠️ 이미지 응답 없음");
    return false;
  } catch (e) {
    console.error(`❌ 에러: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log("🌙 저녁 조명 컨셉 사진 5장 배치 생성");
  console.log("📐 캐노피 스타일: 흰색 사각 카바나 (원본 기준)\n");

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let success = 0;
  for (let i = 0; i < photos.length; i++) {
    const ok = await enhance(photos[i]);
    if (ok) success++;
    if (i < photos.length - 1) {
      console.log("⏳ 15초 대기 (API 제한)...");
      await new Promise(r => setTimeout(r, 15000));
    }
  }
  console.log(`\n🎉 완료! ${success}/${photos.length}장 생성됨`);
  console.log(`📁 저장 위치: ${OUT_DIR}`);
}

main();
