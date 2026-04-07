/**
 * 통합 배치:
 * Part A - 저녁 조명 컨셉 사진 5장 (새로 생성)
 * Part B - 지형 원본 위에 캐노피+BBQ 설치 5장 (원본 편집)
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
const ORIGINAL_REF = path.join(__dirname, "..", "images", "enhanced", "KakaoTalk_20260406_230249446_enhanced.jpg");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const CANOPY_DESC = `CANOPY STYLE (MUST MATCH EXACTLY — see reference image):
- White/cream rectangular CABANA-style canopy (NOT A-frame, NOT triangular, NOT dome)
- METAL FRAME structure: silver/white vertical poles at 4 corners + horizontal top frame
- FLAT or slightly angled fabric ROOF stretched across the top frame
- WHITE SHEER CURTAINS hanging from all 4 sides, tied back or flowing
- Size: approximately 4m x 4m, about 2.5m tall
- Think: luxury poolside cabana or beach resort cabana — that exact style
- Inside: wooden folding table + camping chairs`;

// ===== PART A: 저녁 조명 컨셉 5장 =====
const partA = [
  {
    name: "A1 - 단일 캐노피 클로즈업 (저녁)",
    output: "concept_01_single_canopy_evening.jpg",
    input: ORIGINAL_REF,
    prompt: `Use the reference image to see the EXACT canopy tent design. Generate a NEW photo in the same resort setting with this same canopy style.

${CANOPY_DESC}

SCENE: Close-up of ONE canopy at dusk/blue hour. Camera at slight angle showing the canopy with curtains partially open. Inside: wooden table with food, warm Edison string lights on the frame. OUTSIDE the canopy on the gravel: a black Weber-style kettle BBQ grill with charcoal smoke. Green grass around the concrete deck pad.

BACKGROUND: Mountains as dark silhouettes, blue-purple twilight sky.
LIGHTING: Warm 2700K glow from string lights inside canopy. Blue hour ambient.
STYLE: Canon EOS R5, 35mm f/1.8. Real DSLR photo. NO watermark, NO text. 4K. Portrait orientation (vertical).`
  },
  {
    name: "A2 - 전체 전경 스트링라이트 (저녁)",
    output: "concept_02_panorama_stringlights.jpg",
    input: ORIGINAL_REF,
    prompt: `Use the reference image to see the EXACT canopy tent design. Generate a NEW wide panoramic photo of the resort at dusk.

${CANOPY_DESC}

SCENE: Wide shot showing 4-5 of these cabana canopies in a row along a concrete pathway. WARM STRING LIGHTS (Edison bulbs) strung between canopy poles and across the pathway. Trees wrapped with warm LED fairy lights. Each canopy glows warmly from inside. Black BBQ grills visible OUTSIDE each canopy on the gravel.

ENVIRONMENT: Concrete pathway center, canopies on right, flower beds left. Mountains silhouettes. Twilight sky. Gravel ground.
LIGHTING: Warm string lights + canopy glow + tree fairy lights. Blue hour sky.
STYLE: Canon EOS R5, 24mm f/2.8. Real DSLR. NO watermark, NO text. 4K. Landscape orientation.`
  },
  {
    name: "A3 - 나무 사이로 본 캐노피 (저녁)",
    output: "concept_03_through_trees.jpg",
    input: ORIGINAL_REF,
    prompt: `Use the reference image to see the EXACT canopy tent design. Generate a photo looking through trees at two canopies during evening.

${CANOPY_DESC}

SCENE: Camera behind ornamental trees/shrubs looking toward TWO adjacent cabana canopies. Trees in foreground wrapped with warm fairy lights creating a sparkling frame. Both canopies glow warmly from Edison string lights inside. White curtains partially drawn with golden light spilling through. BBQ grills OUTSIDE each canopy.

ENVIRONMENT: Gravel pathway visible. Grass areas. Mountain silhouettes. Twilight sky.
LIGHTING: Fairy lights on foreground trees. Warm canopy glow. Blue hour.
STYLE: Canon EOS R5, 50mm f/1.4, bokeh foreground. Real DSLR. NO watermark, NO text. 4K. Landscape orientation.`
  },
  {
    name: "A4 - 원거리 파노라마 (저녁)",
    output: "concept_04_distant_panorama.jpg",
    input: ORIGINAL_REF,
    prompt: `Use the reference image to see the EXACT canopy tent design. Generate a distant wide panoramic shot of the entire resort at dusk.

${CANOPY_DESC}

SCENE: Elevated wide shot showing 5-6 cabana canopies in a row, each glowing warmly. String lights connecting canopies. Concrete pathway through center. "HAVEN" concrete wall visible. Trees with fairy lights. A few people silhouettes near canopies. BBQ grills OUTSIDE canopies.

ENVIRONMENT: Full mountain panorama, dark silhouettes. Gradient twilight sky (deep blue to purple/orange at horizon). Gravel ground, grass borders.
LIGHTING: Multiple warm sources — canopy interiors, string lights, tree lights, ground lights.
STYLE: Canon EOS R5, 16mm f/4 ultra-wide. Real DSLR. NO watermark, NO text. 4K. Landscape orientation.`
  },
  {
    name: "A5 - 캐노피 내부에서 바깥 뷰 (저녁)",
    output: "concept_05_inside_looking_out.jpg",
    input: ORIGINAL_REF,
    prompt: `Use the reference image to see the EXACT canopy tent design. Generate a photo from INSIDE one canopy looking out at evening.

${CANOPY_DESC}

SCENE: Camera INSIDE a canopy looking out through open curtains. FOREGROUND: wooden table with wine glasses, cheese board, warm candles. Edison string lights on canopy frame above. White curtains frame the view on sides.

OUTSIDE: pathway, other canopies glowing warmly, string lights between them. A BBQ grill just outside this canopy. Mountain silhouettes against blue-purple twilight sky.

LIGHTING: Warm candles + string lights inside. Other canopy glow outside. Blue hour sky.
STYLE: Canon EOS R5, 24mm f/1.4. Real DSLR. Cozy, romantic. NO watermark, NO text. 4K. Landscape orientation.`
  }
];

// ===== PART B: 지형 원본 위에 캐노피 설치 5장 =====
const partB = [
  {
    name: "B1 - _08 잔디+데크 위 캐노피 설치",
    output: "terrain_08_with_canopy.jpg",
    input: path.join(__dirname, "..", "images", "KakaoTalk_20260406_230249446_08.jpg"),
    prompt: `Edit this photo: place white rectangular cabana canopy tents on each of the concrete deck pads visible on the grass.

${CANOPY_DESC}

This photo shows a grassy area with several rectangular concrete deck pads, pine trees, and mountains behind.

TASK: On EACH visible concrete deck pad, place one cabana canopy tent matching the description above. The canopy should sit perfectly on each deck pad, proportional to the pad size.

OUTSIDE each canopy (on the grass next to the deck, NOT inside): place a black Weber-style kettle BBQ grill.

KEEP UNCHANGED: The grass, concrete pads, pine trees, pathway, mountains, sky — ALL existing elements stay exactly as they are. Only ADD the canopy structures on the pads and BBQ grills outside.

STYLE: Bright daytime, same lighting as original. Real DSLR quality. NO watermark, NO text. 4K.`
  },
  {
    name: "B2 - _10 보행로+데크 위 캐노피 설치",
    output: "terrain_10_with_canopy.jpg",
    input: path.join(__dirname, "..", "images", "KakaoTalk_20260406_230249446_10.jpg"),
    prompt: `Edit this photo: place white rectangular cabana canopy tents on each concrete deck pad along the pathway.

${CANOPY_DESC}

This photo shows a concrete pathway with rectangular deck pads on both sides, grass borders, and mountains behind.

TASK: On EACH concrete deck pad, place one cabana canopy tent. They should form a neat row along the pathway.

OUTSIDE each canopy (on the grass/gravel NEXT to the deck, NOT under the canopy): place a black Weber-style kettle BBQ grill.

KEEP UNCHANGED: pathway, deck pads, grass, all landscaping, mountains, sky, concrete walls — everything stays. Only ADD canopies on pads + BBQ grills outside.

STYLE: Bright daytime. Real DSLR. NO watermark, NO text. 4K.`
  },
  {
    name: "B3 - _02 상부 구역 캐노피 설치",
    output: "terrain_02_with_canopy.jpg",
    input: path.join(__dirname, "..", "images", "KakaoTalk_20260406_230249446_02.jpg"),
    prompt: `Edit this photo: add white rectangular cabana canopy tents on the concrete deck areas visible in this hillside glamping site.

${CANOPY_DESC}

This photo shows a hillside area with concrete structures/walls, deck areas, and mountain views.

TASK: On each flat concrete deck area, place a cabana canopy tent. Place BBQ grills (black Weber kettle style) OUTSIDE each canopy on the adjacent ground.

KEEP UNCHANGED: All concrete structures, walls, railings, vegetation, mountains, sky. Only ADD canopies + BBQ grills.

STYLE: Bright daytime. Real DSLR. NO watermark, NO text. 4K.`
  },
  {
    name: "B4 - _04 높은곳 전경 캐노피 설치",
    output: "terrain_04_with_canopy.jpg",
    input: path.join(__dirname, "..", "images", "KakaoTalk_20260406_230249446_04.jpg"),
    prompt: `Edit this photo: place white rectangular cabana canopy tents on each concrete deck pad visible from this elevated viewpoint.

${CANOPY_DESC}

This photo shows an elevated view looking down at the resort site — concrete deck pads in rows on grass, a pathway, and a beautiful mountain valley panorama.

TASK: On EACH concrete deck pad, place one cabana canopy tent. From this aerial-ish angle, the canopy roofs (flat white fabric tops) should be clearly visible.

OUTSIDE each canopy: a black BBQ grill on the grass/gravel next to the deck.

KEEP UNCHANGED: All deck pads, grass, pathway, concrete elements, mountains, sky, clouds — everything. Only ADD canopies + BBQ grills.

STYLE: Bright daytime. Real DSLR. NO watermark, NO text. 4K.`
  },
  {
    name: "B5 - _05 입구/구조물 구역 캐노피",
    output: "terrain_05_with_canopy.jpg",
    input: path.join(__dirname, "..", "images", "KakaoTalk_20260406_230249446_05.jpg"),
    prompt: `Edit this photo: this shows the entrance/common area of a glamping resort with concrete structures and mountain views. Add cabana canopy tents in the open flat areas.

${CANOPY_DESC}

TASK: In the open concrete/flat areas between the structures, place 2-3 cabana canopy tents. These should look naturally placed, proportional to the space. Place BBQ grills (black Weber kettle) OUTSIDE each canopy.

KEEP UNCHANGED: All concrete structures, buildings, mountains, sky, vegetation. Only ADD canopies + BBQ grills in open spaces.

STYLE: Bright daytime. Real DSLR. NO watermark, NO text. 4K.`
  }
];

const allPhotos = [...partA, ...partB];

async function enhance(photo) {
  console.log(`\n🎨 [${photo.name}] 처리 중...`);

  const inputBuffer = fs.readFileSync(photo.input);
  const ext = photo.input.endsWith(".png") ? "image/png" : "image/jpeg";

  // Part A는 원본을 레퍼런스로, Part B는 원본+레퍼런스 둘 다
  const parts = [
    { inlineData: { mimeType: ext, data: inputBuffer.toString("base64") } },
  ];

  // Part B에는 캐노피 스타일 레퍼런스도 추가
  if (photo.name.startsWith("B")) {
    try {
      const refBuffer = fs.readFileSync(ORIGINAL_REF);
      parts.push({ inlineData: { mimeType: "image/jpeg", data: refBuffer.toString("base64") } });
      parts.push({ text: `FIRST IMAGE: The terrain photo to edit. SECOND IMAGE: Reference showing the EXACT canopy style to use.\n\n${photo.prompt}` });
    } catch(e) {
      parts.push({ text: photo.prompt });
    }
  } else {
    parts.push({ text: photo.prompt });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ parts }],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          fs.writeFileSync(path.join(OUT_DIR, photo.output), Buffer.from(part.inlineData.data, "base64"));
          console.log(`✅ 저장: ${photo.output}`);
          return true;
        }
        if (part.text) console.log(`📝 ${part.text.substring(0, 200)}`);
      }
    }
    console.log("⚠️ 이미지 없음");
    return false;
  } catch (e) {
    console.error(`❌ ${e.message}`);
    return false;
  }
}

async function main() {
  console.log("=".repeat(50));
  console.log("🏕️ 통합 배치 생성: 10장");
  console.log("  Part A: 저녁 조명 컨셉 5장 (새 생성)");
  console.log("  Part B: 지형 원본 + 캐노피 설치 5장 (편집)");
  console.log("=".repeat(50));

  let success = 0;
  for (let i = 0; i < allPhotos.length; i++) {
    const ok = await enhance(allPhotos[i]);
    if (ok) success++;
    if (i < allPhotos.length - 1) {
      const wait = 12;
      console.log(`⏳ ${wait}초 대기...`);
      await new Promise(r => setTimeout(r, wait * 1000));
    }
  }
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🎉 완료! ${success}/${allPhotos.length}장 생성`);
  console.log(`📁 ${OUT_DIR}`);
}

main();
