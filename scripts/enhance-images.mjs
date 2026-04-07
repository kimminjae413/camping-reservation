/**
 * 캠핑장 사진 AI 향상 스크립트
 * Gemini API (Nano Banana)를 사용하여 실제 캠핑장 사진을 마케팅용 고품질 사진으로 변환
 *
 * 사용법: node scripts/enhance-images.mjs
 */

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// .env 수동 로드 (dotenv 없이)
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

const INPUT_DIR = path.join(__dirname, "..", "images");
const OUTPUT_DIR = path.join(__dirname, "..", "images", "enhanced");

// ─── 공통 스타일 지시 (모든 프롬프트 끝에 추가) ───
const COMMON_STYLE = `

CRITICAL STYLE REQUIREMENTS:
- This photo is for Naver Place (네이버플레이스) marketing of a premium glamping resort called "더헤이븐리트리" (The Heavenly Tree)
- Style reference: Stonery (stonery.kr) - luxury boutique mountain resort aesthetic
- Color palette: warm earth tones, deep forest greens, soft golden amber, muted concrete grays
- The result MUST look like it was taken by a professional photographer with a high-end DSLR camera
- NO artificial/AI look. Natural film grain, realistic lens characteristics, authentic light behavior
- Resolution: 4K ultra-high resolution, sharp details, professional marketing quality
- This image will be the FIRST impression customers see. Make it stunning and aspirational.`;

// 사진별 맞춤 프롬프트 (더헤이븐리트리 / 네이버플레이스 마케팅용)
const photoPrompts = {
  "KakaoTalk_20260406_230249446.jpg": {
    name: "캠핑장 전경 (메인 히어로)",
    prompt: `Transform this camping site photo into a breathtaking luxury glamping resort hero image for marketing.

This photo shows a pathway through a glamping site with crushed gravel (파쇄석) ground and scattered wooden deck platforms on each site, surrounded by mountains.

Shot on Canon EOS R5 with 24mm f/2.8 wide-angle lens, f/8 for deep focus.
- Dramatically enhance the lush green mountains with rich, cinematic depth and atmospheric haze layers
- Add stunning golden hour lighting (magic hour) with warm amber glow washing over the pathways and deck sites
- The crushed gravel ground should look pristine, clean, and premium — like a high-end resort ground cover
- Wooden deck platforms should glow warmly in the sunlight, looking inviting
- Grass borders should be vibrant, perfectly manicured emerald green
- Sky should be dramatic with beautiful golden clouds or deep clear blue
- Add subtle sun rays or lens flare for cinematic effect
- The scene should feel like a luxury mountain escape, peaceful and aspirational` + COMMON_STYLE
  },

  "KakaoTalk_20260406_230249446_01.jpg": {
    name: "캠핑장 건물 외관 1",
    prompt: `Transform this camping facility exterior into a luxury boutique resort marketing photo.

This shows a modern concrete building with clean architectural lines, set against mountains. The facility is part of a premium glamping resort.

Shot on Sony A7IV with 35mm f/1.8 lens.
- IMPORTANT: Fix the image rotation to proper upright landscape orientation
- Make the modern concrete architecture look sleek, premium, and intentionally designed
- Add beautiful warm late-afternoon golden light with long dramatic shadows
- Mountains in background should have atmospheric blue-purple haze for depth
- All landscaping should look pristine and resort-quality
- Add warm rim light on building edges catching the golden sun
- The building should feel like a luxury boutique hotel in the mountains
- Concrete textures should be enhanced to look intentional and modern (like exposed concrete architecture)` + COMMON_STYLE
  },

  "KakaoTalk_20260406_230249446_02.jpg": {
    name: "건물 테라스/데크 뷰",
    prompt: `Transform this facility terrace photo into an inviting luxury resort lounge image.

This shows a terrace or deck area with parasol and outdoor seating, overlooking mountains. Part of a premium glamping resort.

Shot on Canon EOS R5 with 35mm f/2.0 lens.
- IMPORTANT: Fix the image rotation to proper upright landscape orientation
- Make the terrace look like a luxury resort outdoor lounge
- Parasol and outdoor furniture should look premium and stylish
- Add warm, dreamy golden hour lighting with soft bokeh in distance
- Mountains should be beautifully layered with atmospheric depth
- The scene should make people want to sit there and relax
- Add subtle warm ambient glow suggesting comfort and luxury
- Enhance all textures: wood, concrete, fabric to look high-end` + COMMON_STYLE
  },

  "KakaoTalk_20260406_230249446_03.jpg": {
    name: "건물 외관 다른 각도",
    prompt: `Transform this facility exterior photo into a premium architectural marketing image.

This shows the glamping resort building from a different angle, with modern concrete construction and mountain backdrop.

Shot on Sony A7IV with 24mm f/2.8 lens.
- IMPORTANT: Fix the image rotation to proper upright landscape orientation
- Enhance the architectural character — make it look like intentional modern design
- Beautiful warm sunlight with dramatic shadow interplay on concrete surfaces
- Surrounding vegetation should be lush and well-maintained
- Mountain scenery enhanced with rich greens and atmospheric depth
- The building should feel premium and architecturally interesting
- Add warm color grading that makes concrete feel inviting, not cold` + COMMON_STYLE
  },

  "KakaoTalk_20260406_230249446_04.jpg": {
    name: "파쇄석 + 데크 사이트 전경",
    prompt: `Transform this camping site overview into a stunning premium glamping marketing hero shot.

IMPORTANT CONTEXT: This photo shows the glamping site layout with crushed gravel (파쇄석) ground and individual wooden deck platforms scattered across the site. Each deck is a private camping/glamping spot. The site overlooks a beautiful mountain valley.

Shot on Canon EOS R5 with 24mm f/2.8 wide-angle lens, golden hour.
- The crushed gravel ground must look clean, raked, and premium — like a Japanese zen garden or luxury resort ground
- Each wooden deck platform should look warm, inviting, and ready for guests to set up their glamping
- Add gorgeous golden hour lighting bathing the entire scene in warm amber tones
- Mountain valley backdrop should be breathtaking with rich greens and atmospheric depth
- Grass borders between gravel and pathways should be perfectly manicured
- The overall scene should scream "luxury outdoor experience" — not "basic campground"
- Add subtle warm glow suggesting cozy evening is approaching
- Sky should be dramatic and beautiful` + COMMON_STYLE
  },

  "KakaoTalk_20260406_230249446_05.jpg": {
    name: "바베큐장 (타프 & BBQ 시설)",
    prompt: `Transform this outdoor communal BBQ area into a premium glamping resort entertainment space marketing photo.

IMPORTANT CONTEXT: This is the BBQ and communal area of a luxury glamping resort. In reality, this area has tarp/awning covers set up over the BBQ stations with grills and cooking equipment ready for guests. Make this space look like a premium outdoor dining and BBQ experience.

Shot on Sony A7IV with 24mm f/2.8 wide-angle lens.
- The concrete shelter structure should look like intentional modern architecture
- Enhance to show this as a well-equipped, premium outdoor BBQ and gathering space
- Add warm, atmospheric lighting — imagine string lights or warm ambient glow
- The space should look like guests could have an amazing BBQ dinner here
- Mountain greenery backdrop should be lush and cinematic
- Add inviting warm golden tones suggesting evening gathering atmosphere
- Make the concrete surfaces look clean, modern, and intentionally designed
- The vibe should be: "luxury outdoor dining experience in the mountains"` + COMMON_STYLE
  },

  "KakaoTalk_20260406_230249446_06.jpg": {
    name: "잔디 사이트 (나무 그늘 힐링)",
    prompt: `Transform this grass camping site with pine trees into THE signature marketing image for this luxury glamping resort.

This shows a beautifully landscaped grass area with concrete deck pads, mature pine trees providing natural shade, and mountains in the background. This is where guests set up premium glamping.

Shot on Canon EOS R5 with 50mm f/1.4 lens, shallow depth of field.
- This should be the MOST beautiful photo — the one that makes people book immediately
- Green lawn must look like a golf course: perfectly manicured, vibrant emerald
- Concrete deck pads should look clean and premium
- Pine trees should have gorgeous dappled sunlight filtering through branches
- Create beautiful bokeh effect on distant mountains
- Golden hour lighting with warm, dreamy atmosphere
- The scene should feel like a peaceful luxury nature sanctuary
- Add cinematic color grading: warm golden tones with rich green contrast
- Every detail should scream "premium glamping experience"
- Must evoke emotion: serenity, luxury, escape from city life` + COMMON_STYLE
  },

  // _07 is duplicate of _04, _08 is duplicate of _06 — skip them

  "KakaoTalk_20260406_230249446_09.jpg": {
    name: "드라마틱 구름 감성컷",
    prompt: `Transform this moody mountain landscape into a dramatic, cinematic editorial image for luxury resort marketing.

This shows the glamping site with crushed gravel paths, deck platforms, and dramatic cloudy mountain scenery. The moody atmosphere is actually a STRENGTH — use it.

Shot on Canon EOS R5 with 35mm f/2.0 lens, dramatic composition.
- IMPORTANT: Fix the image rotation to proper upright landscape orientation
- KEEP and INTENSIFY the dramatic moody atmosphere — this is the "dramatic" shot in the collection
- Clouds should be cinematic: dramatic formations with subtle golden light breaking through
- Mountains should have beautiful atmospheric layering: near=detailed, far=misty silhouettes
- Gravel pathways and deck sites should have subtle warm tones contrasting the cool sky
- This should look like a scene from a luxury travel documentary
- Color grading: moody cinematic with warm earth ground vs cool dramatic sky
- The mood should be: "exclusive mountain retreat above the clouds"
- This is the emotional, aspirational shot — make viewers feel something` + COMMON_STYLE
  },

  "KakaoTalk_20260406_230249446_10.jpg": {
    name: "사이트 전체 조감 뷰",
    prompt: `Transform this camping site overview into a premium resort facility overview marketing image.

This shows the overall layout of the glamping resort from an elevated angle, with buildings, deck sites on crushed gravel, pathways, and mountain forest surroundings.

Shot on Sony A7IV with 24mm f/2.8 wide-angle lens.
- IMPORTANT: Fix the image rotation to proper upright landscape orientation
- This should serve as the "facility overview" shot — showing the entire resort layout beautifully
- Enhance all architectural elements to look modern and premium
- Add gorgeous golden hour lighting across the entire scene
- Forest and mountain surroundings should look lush and inviting
- Pathways should be clean and well-defined
- Each deck site area should look inviting and ready for guests
- The overall impression should be: "this is a well-designed, premium resort"` + COMMON_STYLE
  },

  "KakaoTalk_20260406_230249446_11.jpg": {
    name: "산책로 라이프스타일컷",
    prompt: `Transform this pathway photo into a luxury resort lifestyle marketing image.

This shows a walking path through the glamping resort with an outdoor chair visible, crushed gravel areas, and mountains/forest in the background. This is the lifestyle/mood shot.

Shot on Canon EOS R5 with 50mm f/1.4 lens, shallow depth of field with beautiful bokeh.
- IMPORTANT: Fix the image rotation to proper upright landscape orientation
- The pathway should look like a premium resort promenade
- Outdoor chair/furniture should look inviting — "sit here and relax" feeling
- Add gorgeous golden hour backlighting with warm long shadows
- Beautiful soft bokeh on background mountains and trees
- Forest and mountain backdrop should be rich deep green with atmospheric depth
- This should be a lifestyle shot: someone seeing this should imagine themselves walking here
- Color grading: warm, dreamy, golden — like a luxury travel magazine spread
- The feeling should be: "peaceful morning walk at a mountain retreat"` + COMMON_STYLE
  }
};

// 중복 파일 스킵 목록
const SKIP_FILES = [
  "KakaoTalk_20260406_230249446_07.jpg", // duplicate of _04
  "KakaoTalk_20260406_230249446_08.jpg", // duplicate of _06
];

async function enhanceImage(filename, config) {
  const inputPath = path.join(INPUT_DIR, filename);
  const outputPath = path.join(OUTPUT_DIR, filename.replace(".jpg", "_enhanced.jpg"));

  if (fs.existsSync(outputPath)) {
    console.log(`⏭️  [${config.name}] 이미 처리됨, 스킵`);
    return;
  }

  console.log(`\n🎨 [${config.name}] 처리 중: ${filename}`);

  // 이미지를 base64로 읽기
  const imageBuffer = fs.readFileSync(inputPath);
  const base64Image = imageBuffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
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
          console.log(`✅ [${config.name}] 저장 완료: ${outputPath}`);
          return;
        }
      }
    }

    console.log(`⚠️  [${config.name}] 이미지 응답 없음, 텍스트 응답 확인:`);
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) console.log(`   ${part.text.substring(0, 200)}`);
      }
    }
  } catch (error) {
    console.error(`❌ [${config.name}] 에러:`, error.message);

    // Rate limit 시 대기 후 재시도 안내
    if (error.message.includes("429") || error.message.includes("rate")) {
      console.log("   ⏳ Rate limit 도달. 60초 후 다시 시도해주세요.");
    }
  }
}

async function main() {
  console.log("🏕️  더헤이븐리트리 캠핑장 사진 향상 시작");
  console.log(`📂 입력: ${INPUT_DIR}`);
  console.log(`📂 출력: ${OUTPUT_DIR}`);
  console.log(`📸 처리 대상: ${Object.keys(photoPrompts).length}장 (중복 ${SKIP_FILES.length}장 제외)\n`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const entries = Object.entries(photoPrompts);

  for (let i = 0; i < entries.length; i++) {
    const [filename, config] = entries[i];

    if (SKIP_FILES.includes(filename)) {
      console.log(`⏭️  [${config.name}] 중복 파일, 스킵`);
      continue;
    }

    await enhanceImage(filename, config);

    // Rate limit 방지: 각 요청 사이 10초 대기
    if (i < entries.length - 1) {
      console.log("   ⏳ 10초 대기 (Rate limit 방지)...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }

  console.log("\n🎉 모든 사진 처리 완료!");
  console.log(`📂 결과 확인: ${OUTPUT_DIR}`);
}

main();
