/**
 * 네이버 플레이스 업로드용 샘플 이미지 10장 생성
 *
 * 3개 사이트 체계 (2026-04-11 확정):
 * - 사이트1: 콘크리트 데크 + Classic TP 피라미드 캐노피 + 타프 연결 바베큐 + F&B 건물
 * - 사이트2: 나무 데크 + 벨텐트/사파리텐트 (대형, 가족용)
 * - 사이트3: 파쇄석 + 고객 지참 개인 텐트 (자율)
 *
 * 분포: 1(3) + 2(3) + 3(3) + 전체(1) = 10장
 * Hero Shot 3장(#01/#04/#07)은 바닥+텐트 정면 클로즈업으로 3-way 구분 극대화
 *
 * 사용법: node scripts/generate-naver-place-samples.mjs
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
const OUTPUT_DIR = path.join(__dirname, "..", "images", "naver-place");

// ═══════════════════════════════════════════════════
// 공통 모디파이어 — AI티 방지 + DSLR 톤
// ═══════════════════════════════════════════════════
const NATURAL_STYLE = `

STYLE & CAMERA (CRITICAL — must look REAL, not AI):
- Shot on Canon EOS R5 or Sony A7IV, 35mm f/2.0 lens
- Natural daylight only, no studio lighting
- Subtle film grain, realistic color science (NOT oversaturated)
- Moderate depth of field (f/2.8~f/5.6) — avoid exaggerated bokeh
- True-to-life colors, natural white balance

AUTHENTICITY RULES (for Naver Place upload — real customer photo feel):
- NOT a staged advertising photo — looks like a candid photo taken by an actual visitor
- NOT perfectly symmetric composition — slightly off-center, natural framing
- Slight imperfections ENCOURAGED: wrinkled tent fabric, casual chair placement,
  a stray leaf on the deck, asymmetric grill smoke, natural shadows
- Warm realistic skin tones (not overly smoothed AI skin)
- NO perfect grass, NO perfectly arranged gear
- NO AI-generated symmetry artifacts

PEOPLE POSING (if people present):
- People in natural candid poses — cooking, chatting with each other, looking at mountains
- NEVER posing for the camera, NEVER perfect smile at lens
- Prefer back views, side views, or people engaged in activity
- People should be slightly out of focus or mid-distance, not hero subjects
- Wearing casual outdoor clothing (not brand-new, slightly worn)

FORBIDDEN:
- NO hyperreal "Instagram-filter" look
- NO tilt-shift miniature effect
- NO extreme HDR / dramatic clouds
- NO floating / impossible perspectives
- NO duplicated or morphed faces/hands (classic AI artifacts)
- NO perfectly rendered hands in foreground
- NO unrealistic tent sizes (tents must look real-world sized vs. people)

BACKGROUND PRESERVATION:
- PRESERVE the exact mountain scenery (V-shaped Korean valley, pine trees) from the reference photo
- Only ADD camping elements — do NOT alter existing terrain, structures, or buildings`;

// ═══════════════════════════════════════════════════
// 사이트별 전용 모디파이어
// ═══════════════════════════════════════════════════

const SITE1_RULES = `

SITE 1 — CLASSIC TP CANOPY BBQ ZONE (사이트1):
- Ground: FLAT CONCRETE DECK platform (light gray, smooth, visible seams/joints)

TENT STRUCTURE — CRITICAL TWO-PART GEOMETRY (Classic TP style):
  * This is NOT a pure pyramid tent. It is a SQUARE PAVILION + PYRAMID ROOF combination.
  * LOWER 2/3 (vertical square walls):
    - 4 VERTICAL canvas walls forming a square box shape (like a gazebo)
    - Walls rise STRAIGHT UP from the concrete deck, perpendicular to ground
    - Each wall is flat canvas fabric, approximately 2m tall
    - Front wall has an open entrance flap; the other 3 walls are visible as solid fabric panels
    - Think: a square cabin/pavilion with fabric walls
  * UPPER 1/3 (pyramid roof on top of the walls):
    - 4 TRIANGULAR canvas panels resting ON TOP of the square walls
    - The 4 triangles meet at a single peak at the top
    - There is a CLEARLY VISIBLE horizontal seam/edge line where the vertical walls end and the pyramid roof begins
    - Peak height total ~3.5m (walls 2m + pyramid roof 1.5m)
  * Reference shape: Korean traditional square pavilion with pyramid hat, or a gazebo with a pointed roof
  * Canvas material in IVORY/CREAM color
  * Base dimensions roughly 3.5m × 3.5m square
  * DO NOT draw a tent where walls and roof are the same fabric converging from ground to peak. The walls must be VERTICAL and the roof must be a SEPARATE pyramid on top.

- Essential: BBQ grill positioned IN FRONT of the canopy entrance (metal charcoal grill)
- Essential: TARP/AWNING extending FROM the canopy front wall OVER the BBQ grill
  (the tarp is an additional fabric extension attached to the canopy front, covering the BBQ area outside the main canopy)
- Background: exposed concrete F&B building with large GLASS WALL facade may be visible
- NO concrete parapet walls around the deck
- NO retaining walls or border walls — the concrete deck sits directly on the natural ground level
- NO wood deck, NO gravel — pure concrete ground only`;

const SITE2_RULES = `

SITE 2 — WOODEN DECK BELL TENT ZONE (사이트2):
- Ground: WOODEN DECK platform (warm brown timber planks, visible wood grain)
- Tent: BELL TENT — LARGE circular canvas tent with central pole + conical roof
  * Circular base (~5m diameter), single central pole making cone shape
  * Canvas in IVORY/BEIGE color
  * May have open entry door flap
  * Family-friendly size — 4~6 person capacity
- Adjacent wooden decks EMPTY or at distance (generous spacing — "너무 촘촘하지 않게")
- Pine trees providing natural shade nearby
- Concrete container management building may be visible in background
- NO concrete deck, NO gravel — pure wooden deck ground`;

const SITE3_RULES = `

SITE 3 — CRUSHED STONE SELF-SETUP ZONE (사이트3):
- Ground: CRUSHED GRAVEL — small gray/white stones, visible textured surface
- Tents: VARIOUS personal DOME-STYLE tents — ROUNDED shapes only
  * Primary shape: DOME tents (rounded, hemispheric curve — like Snowpeak Amenity Dome, Coleman dome)
  * Secondary: tunnel tents (elongated rounded) acceptable
  * STRICTLY FORBIDDEN: A-frame tents, triangular/pyramid tents, teepee, ridge tents
  * All Site 3 tents must have ROUNDED/CURVED silhouettes, NOT triangular
  * Different colors/brands acceptable (olive green, khaki, sand, navy) but all ROUNDED shape
  * Campers brought their OWN gear (personal tables, chairs, coolers — not matching)
- Wide spacing between tents — minimum 2 empty tent-widths between each
- NO wooden decks, NO concrete — pure crushed gravel ground
- Wide slope area — V-shaped mountain valley visible in background

WHY DOMES ONLY: Site 3 needs visual distinction from Site 1 (pyramid canopy) and Site 2 (conical bell tent).
  Using rounded dome shapes here creates clear 3-way differentiation:
  - Site 1: angular pyramid canopy
  - Site 2: conical bell tent
  - Site 3: rounded dome tents
  Do NOT introduce any other triangular shapes into Site 3.`;

// ═══════════════════════════════════════════════════
// 10장 프롬프트 정의
// ═══════════════════════════════════════════════════

const imagePrompts = {

  // ══════════ 사이트1 — 3장 ══════════

  "01_site1_hero_concrete_pyramid": {
    name: "🔥 사이트1 Hero — 콘크리트+사각벽+피라미드지붕",
    originFile: "site1_ref_01.jpg",
    prompt: `Using the reference photo background (concrete deck platform, mountain valley), create a HERO SHOT for Site 1 — the flagship Classic TP BBQ canopy zone.

CRITICAL COMPOSITION (this defines Site 1 visually):
- LOW angle camera position, facing the canopy tent DIRECTLY FROM THE FRONT
- Lower portion (bottom 1/4): CONCRETE DECK clearly visible (smooth gray surface, panel seams, NO walls around it)
- Middle portion (2/4): The SQUARE VERTICAL WALLS of the canopy — 4 flat canvas walls going STRAIGHT UP from the deck
  * Walls are approximately 2m tall
  * Front wall has an open entrance flap showing glimpse of interior
  * Side walls are visible as solid canvas panels
  * These walls are VERTICAL and PERPENDICULAR to ground — like a square pavilion
- Upper portion (top 1/4): The PYRAMID ROOF sitting ON TOP of the square walls
  * 4 triangular canvas panels meeting at a single peak
  * A clearly visible horizontal EDGE/SEAM line where walls end and pyramid roof begins
- Foreground: TARP extending from canopy front entrance + BBQ GRILL underneath the tarp
- The cream/ivory canvas texture clearly shown
- Viewer must INSTANTLY recognize: "concrete deck + square-wall pavilion + pyramid roof on top + covered BBQ"

IMPORTANT: The canopy is NOT a pure triangular/pyramid tent from ground to peak.
It is a SQUARE GAZEBO/PAVILION with vertical fabric walls, topped with a pyramid roof.

Mountain valley in background, bright clear day, natural daylight. This is the definitive Site 1 identity shot.${SITE1_RULES}${NATURAL_STYLE}`
  },

  "02_site1_bbq_action": {
    name: "사이트1 바베큐 액션 (골든아워)",
    originFile: "site1_ref_02.jpg",
    prompt: `Using the reference photo's concrete deck and F&B building setting, create a candid BBQ action scene at Site 1.

SCENE:
- The canopy: SQUARE PAVILION with VERTICAL fabric walls (2m tall) + PYRAMID roof on top
  * Walls rise straight up from the concrete deck, perpendicular
  * Pyramid roof sits on top of the walls with a visible seam/edge line
  * Front wall has open entrance flap; side walls are visible canvas panels
  * NOT a pure pyramid tent — walls must be clearly vertical, roof clearly separated
- Tarp extension from canopy front wall, covering a charcoal BBQ grill outside the canopy
- 2-3 adult Korean campers around the grill — casual candid poses:
  * One person tending the grill (seen from the side, focused on cooking)
  * Another person holding a cold drink, looking at the mountains
  * Optionally a third person setting the table behind
- NO one looking at the camera
- Natural smoke rising from grill (asymmetric, realistic)
- Small side table with drinks, tongs, plates — casually placed
- Wood folding chairs nearby

Golden hour warm light (about 5:30pm). Long soft shadows on the concrete deck. The F&B concrete building may be visible in the distant background.

IMPORTANT: NO concrete parapet walls, NO retaining walls around the deck. The concrete deck is open on all sides.

Candid documentary photography feel — NOT an advertisement.${SITE1_RULES}${NATURAL_STYLE}`
  },

  "03_site1_fnb_building": {
    name: "사이트1 F&B 건물 유리벽",
    originFile: "site1_ref_02.jpg",
    prompt: `Using the reference photo's concrete F&B building as the PRIMARY subject, show it in daytime with Site 1 camping context.

CRITICAL — the building is the main focus:
- Exposed concrete structure, modern minimal architecture
- LARGE GLASS WALL facade (floor-to-ceiling glass panels) — this is the key feature
- Through the glass: visible food preparation counters and simple grocery shelves (bread, snacks, drinks)
- Clean entrance, open surroundings (NO concrete parapet walls)

SITE 1 CAMPING CONTEXT (secondary, in foreground):
- In foreground corner: ONE Classic TP canopy structure partially visible
  * It has VERTICAL square walls (2m tall) + PYRAMID roof on top — NOT a pure pyramid tent
  * Placed on a concrete deck
  * NO bell tent, NO conical tent, NO round tent — this is SITE 1 area which uses ONLY the square-wall-pyramid-roof canopy
- 1 person walking toward the building entrance (seen from behind, carrying a shopping basket or similar)

STRICTLY FORBIDDEN in this image:
- NO bell tents, NO conical tents, NO round canvas tents (those belong to Site 2)
- NO dome tents (those belong to Site 3)
- ONLY the Classic TP square-wall + pyramid-roof canopy is allowed

Bright midday natural light. The concrete + glass contrast is striking against mountain backdrop. Mountains visible beyond.

Architectural documentary style — capture the building as functional camp store + prep kitchen.${SITE1_RULES}${NATURAL_STYLE}`
  },

  // ══════════ 사이트2 — 3장 ══════════

  "04_site2_hero_wood_belltent": {
    name: "🔥 사이트2 Hero — 나무데크+벨텐트 원형",
    originFile: "site23_ref.png",
    prompt: `Using the reference photo background (mountain valley, campsite area marked by blue outline), create a HERO SHOT for Site 2 — the bell tent wooden deck zone.

CRITICAL COMPOSITION (this defines Site 2 visually):
- LOW angle camera position, facing the BELL TENT DIRECTLY FROM THE FRONT
- Lower 1/3 of frame: WOODEN DECK with clearly visible WOOD GRAIN and warm brown timber planks
- Middle and upper 2/3: ROUND BELL TENT — circular base, conical roof with central pole clearly visible
- The bell tent is a LARGE classic circular canvas tent (~5m diameter) in ivory/beige
- Open front door flap showing a glimpse of interior
- ZERO ambiguity: viewer must instantly see "wooden deck + round bell tent with conical roof"
- In the background (distant), pine trees and V-shaped mountain valley
- Empty neighboring wooden decks visible (no crowding)

Bright clear midday, natural daylight. This is the definitive Site 2 identity shot — contrast must be clear against Site 1's pyramid tent.${SITE2_RULES}${NATURAL_STYLE}`
  },

  "05_site2_family_dinner": {
    name: "사이트2 가족 저녁 식사",
    originFile: "KakaoTalk_20260406_230249446_04.jpg",
    prompt: `Using the reference photo's mountain valley background, create a warm family camping dinner scene at Site 2.

SCENE:
- A LARGE bell tent (circular canvas, ivory/beige, conical roof with central pole) on a wooden deck
- Tent front entrance open, showing warm interior lighting
- In front of the tent on the wooden deck: full-size folding camping table with warm LED lantern
- A family of 3-4 (adults and a child or 2 couples) gathered around the table:
  * Candid activity: passing a plate, chatting, a kid pointing at something
  * Back views or side profiles — NOT facing camera
  * Casual outdoor clothing
- Simple meal visible on the table: Korean BBQ or stew, side dishes, drinks
- Camping chairs around the table — full-size adult chairs

Early evening warm light just after sunset. Sky gradient golden to blue. Mountains in soft silhouette. The bell tent glows warm from inside. Other wooden decks in distance are empty.

Candid family moment — NOT staged advertisement.${SITE2_RULES}${NATURAL_STYLE}`
  },

  "06_site2_belltent_bonfire": {
    name: "사이트2 벨텐트 불멍 (블루아워)",
    originFile: "KakaoTalk_20260406_230249446_09.jpg",
    prompt: `Using the reference photo's dramatic cloudy mountain backdrop, create an atmospheric bonfire scene at Site 2.

SCENE:
- One BELL TENT (circular ivory canvas, conical roof) on a wooden deck
- Tent fabric glows warm from interior lighting
- In front of the tent: a small fire pit (불멍 스타일) with gentle flames
- 2 people sitting in wood camping chairs facing the fire (BACK VIEW — we see them from behind)
- They are looking at the fire and mountains, not the camera
- Holding mugs (hot drinks), wrapped in casual outdoor jackets
- Simple wood logs stacked beside the fire pit
- String lights (one natural strand) hung on the tent

Blue hour atmosphere — deep blue twilight sky with last traces of golden sunset on the horizon. Mountains in silhouette. Warm fire glow contrasts with cool blue sky.

Peaceful, intimate, non-staged. Feels like a real camping night photo.${SITE2_RULES}${NATURAL_STYLE}`
  },

  // ══════════ 사이트3 — 3장 ══════════

  "07_site3_hero_gravel_diversity": {
    name: "🔥 사이트3 Hero — 파쇄석+돔텐트 다양성",
    originFile: "site23_ref.png",
    prompt: `Using the reference photo background (mountain valley, wide slope area marked by red outline), create a HERO SHOT for Site 3 — the crushed stone self-setup zone.

CRITICAL COMPOSITION (this defines Site 3 visually):
- LOW ground-level angle camera
- Lower 1/3 of frame: CRUSHED GRAVEL clearly visible — small gray/white stones, textured surface
- Middle 1/3: FOREGROUND personal DOME tent — ROUNDED hemispheric shape (like Snowpeak Amenity Dome or Coleman dome, 2-3 person, olive green or khaki)
- Background 1/3: 1-2 MORE DOME tents at varying distance, each a DIFFERENT color:
  * Another dome tent (sand/beige, rounded)
  * Optionally: one tunnel tent (elongated ROUNDED shape, navy/khaki)
- ALL tents must have ROUNDED/CURVED silhouettes — NO triangular shapes at all
- STRICTLY FORBIDDEN: A-frame tents, teepee, pyramid tents, triangular tents
- Each tent different color but all rounded/dome shape
- Wide spacing between tents (minimum 2 empty widths apart)
- Personal gear near each tent (mismatched chairs, tables — brought by different campers)
- ZERO ambiguity: viewer instantly sees "gravel ground + rounded DOME tents"

Bright clear midday, natural daylight. Mountain valley behind. This is the definitive Site 3 identity shot — must look distinctly different from:
  - Site 1 (square pavilion with pyramid roof — angular)
  - Site 2 (conical bell tent — pointed top)
  - Site 3 (rounded DOME tents — curved top)
All Site 3 silhouettes are ROUND/DOME, giving the clear 3-way distinction.${SITE3_RULES}${NATURAL_STYLE}`
  },

  "08_site3_couple_sunset": {
    name: "사이트3 커플 석양 뒷모습",
    originFile: "site23_ref.png",
    prompt: `Using the reference photo background (mountain valley, wide gravel slope marked by red outline — this is the Site 3 area), create a peaceful couple sunset scene at Site 3.

LOCATION CONTEXT (CRITICAL):
- This scene is set in SITE 3 — the CRUSHED GRAVEL self-setup zone
- Ground MUST be CRUSHED GRAVEL (small gray/white stones) — NOT wooden deck, NOT concrete
- NO wooden deck platforms anywhere in the frame
- NO "Site 3" text labels, NO signage, NO watermarks of any kind

SCENE:
- One personal DOME tent on the gravel ground (small 2-person rounded dome, sage green or khaki)
  * Tent silhouette is ROUNDED/hemispheric — NOT triangular, NOT A-frame
- Two low Helinox-style camping chairs directly on the gravel in front of the tent, facing the mountain view
- A couple (2 adults) seated in the chairs — BACK VIEW only, we see their shoulders and the backs of their heads
- One person leaning slightly toward the other — natural intimate posture
- A small side table between them with 2 enamel mugs
- A travel blanket draped over one chair

Dramatic sunset sky — golden hour transitioning to dusk. Long horizontal light rays. Mountain silhouettes. The entire scene is lit warmly from the side.

STRICTLY FORBIDDEN:
- NO Classic TP canopy (that's Site 1)
- NO bell tent (that's Site 2)
- NO wooden deck platform
- NO A-frame or triangular tents
- NO text labels or signage visible in the frame

Quiet, intimate, cinematic. Natural documentary feel — not an ad shot.${SITE3_RULES}${NATURAL_STYLE}`
  },

  "09_site3_camper_daylife": {
    name: "사이트3 캠퍼 일상 오후",
    originFile: "site23_ref.png",
    prompt: `Using the reference photo background (mountain valley, gravel slope marked by red outline — Site 3 area), create a slice-of-life camper afternoon scene at Site 3.

LOCATION CONTEXT (CRITICAL):
- This scene is set in SITE 3 — the CRUSHED GRAVEL self-setup zone
- Ground MUST be CRUSHED GRAVEL (small gray/white stones)
- NO wooden deck, NO concrete, NO any other surface

SCENE:
- One personal DOME tent on the gravel ground
  * ROUNDED hemispheric shape (like Snowpeak or Coleman dome), sand/khaki canvas color
  * 2-3 person size
  * NOT A-frame, NOT triangular, NOT pyramid — only ROUNDED dome shape
- 1-2 people doing casual camping activities:
  * One person reading a book in a low camping chair (side profile, looking at book)
  * Optionally: another person adjusting a tent guy-line or checking a camping stove
- Personal gear scattered naturally on the gravel: backpack leaning on tent, boots by entrance, water bottle on a small folding table
- Small portable camping stove on a folding table with a kettle
- Nothing perfectly arranged — the "lived-in" camping feel

Warm afternoon light (around 3pm). Mountains visible in background with subtle atmospheric haze.

STRICTLY FORBIDDEN:
- NO A-frame tents, NO triangular tents, NO pyramid tents
- NO Classic TP canopy (Site 1), NO bell tent (Site 2)
- NO wooden deck, NO concrete ground

Documentary photo style — feels like a friend took this while visiting.${SITE3_RULES}${NATURAL_STYLE}`
  },

  // ══════════ 전체 뷰 — 1장 ══════════

  "10_overview_thumbnail": {
    name: "캠핑장 전체 뷰 (대표 썸네일)",
    originFile: "KakaoTalk_20260406_230249446_10.jpg",
    prompt: `Using this elevated/overview reference photo as the EXACT background, create a comprehensive campsite showcase showing ALL THREE site types at a glance.

CAMPSITE LAYOUT (must show the 3-zone system with clear shape differentiation):

ZONE A — Site 1 (distant or foreground corner):
  - A few CONCRETE DECKS
  - Canopy structures: SQUARE PAVILIONS with VERTICAL walls + PYRAMID roof on top (2 visible)
  - NOT pure pyramid tents — the canopies have clear vertical side walls and separate pyramid hats
  - Tarps extending from canopy fronts + BBQ grills underneath
  - Shape silhouette: ANGULAR box-with-hat

ZONE B — Site 2 (middle area):
  - WOODEN DECKS
  - BELL TENTS: LARGE round canvas tents with CONICAL pointed roof and central pole (2 visible)
  - Shape silhouette: CONICAL pointed top

ZONE C — Site 3 (other area):
  - CRUSHED GRAVEL area
  - DOME tents only: 2-3 ROUNDED hemispheric tents, different colors
  - NO A-frame, NO triangular, NO pyramid tents in this zone
  - Shape silhouette: ROUNDED/curved top

THREE-WAY VISUAL DISTINCTION:
  Site 1 = angular box-pavilion with pyramid hat
  Site 2 = conical bell tent with sharp point
  Site 3 = rounded hemispheric dome

- Concrete F&B building visible somewhere in the composition
- Pathways connecting the zones
- A FEW scattered campers visible (not crowded — 4-5 people total across the whole scene)
- All zones must have generous spacing (not crowded)
- V-shaped mountain valley backdrop preserved from reference

STRICTLY FORBIDDEN:
- NO bell tents in Site 1 or Site 3 areas
- NO pyramid/triangular tents in Site 2 or Site 3 areas
- NO dome tents in Site 1 or Site 2 areas
- NO text labels, NO site number signs

Bright midday clear sky. Shot on Canon EOS R5, 24mm wide-angle, f/8. Landscape photography style — sharp throughout the frame. This is the HERO THUMBNAIL for Naver Place.${NATURAL_STYLE}`
  }
};

// ═══════════════════════════════════════════════════
// 이미지 생성 함수 (기존 패턴 재사용)
// ═══════════════════════════════════════════════════

function loadImageAsBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString("base64");
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  return "image/jpeg";
}

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
  const mimeType = getMimeType(config.originFile);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
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
      return generateImage(outputName, config);
    }
    return false;
  }
}

// ═══════════════════════════════════════════════════
// 메인 실행
// ═══════════════════════════════════════════════════

async function main() {
  console.log("🏕️  네이버 플레이스 샘플 10장 생성 시작");
  console.log(`   모델: gemini-3.1-flash-image-preview (나노바나나2)`);
  console.log(`   📂 참조: ${ORIGIN_DIR}`);
  console.log(`   📂 출력: ${OUTPUT_DIR}`);
  console.log(`   📸 총 ${Object.keys(imagePrompts).length}장 생성 예정`);
  console.log(`   ⏱️  예상 소요: 약 7~8분\n`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const entries = Object.entries(imagePrompts);
  let success = 0;
  let fail = 0;
  const failures = [];

  for (let i = 0; i < entries.length; i++) {
    const [outputName, config] = entries[i];
    const result = await generateImage(outputName, config);

    if (result) success++;
    else {
      fail++;
      failures.push(config.name);
    }

    if (i < entries.length - 1) {
      console.log("   ⏳ 10초 대기 (Rate limit 방지)...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`🎉 생성 완료! 성공: ${success}장 / 실패: ${fail}장`);
  console.log(`📂 결과: ${OUTPUT_DIR}`);
  if (failures.length > 0) {
    console.log(`\n❌ 실패한 이미지:`);
    failures.forEach((f) => console.log(`   - ${f}`));
  }
}

main();
