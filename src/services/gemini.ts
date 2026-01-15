import type { GeneratedImage, GeminiPart, GeminiResponse, ImageGenerationInput, AspectRatioOption } from '../types';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

const CHARACTER_PROMPT = `この風景写真にキャラクターを設置してください。写真はそのままで、イラスト調にしないこと。
キャラクターは観光客としてこの場にいます。風景にあったポーズを取らせること。
なお、プライバシーの観点から、写真に人物の顔が映っている場合はモザイク処理してください。

女の子の特徴を以下に示す。
- ヘアピンはポーランド国旗の形をしています。
- 黒いシュシュを使って高めの位置でポニーテールをまとめている。
- Tシャツの胸の部分には、「AITuber」という文字が書かれている。
- ジーンズのショートパンツを履いている。
- 瞳は淡い琥珀色。
- 数種類の小さなピアスを両耳に付けている。
- 上着を着ている。`;

const ASPECT_RATIO_OPTIONS: { ratio: AspectRatioOption; value: number }[] = [
  { ratio: '1:1', value: 1 },
  { ratio: '5:4', value: 5 / 4 },
  { ratio: '4:5', value: 4 / 5 },
  { ratio: '4:3', value: 4 / 3 },
  { ratio: '3:4', value: 3 / 4 },
  { ratio: '3:2', value: 3 / 2 },
  { ratio: '2:3', value: 2 / 3 },
  { ratio: '16:9', value: 16 / 9 },
  { ratio: '9:16', value: 9 / 16 },
  { ratio: '21:9', value: 21 / 9 },
  { ratio: '9:21', value: 9 / 21 },
];

export function findClosestAspectRatio(width: number, height: number): AspectRatioOption {
  const imageRatio = width / height;
  let closest = ASPECT_RATIO_OPTIONS[0];
  let minDiff = Math.abs(imageRatio - closest.value);

  for (const option of ASPECT_RATIO_OPTIONS) {
    const diff = Math.abs(imageRatio - option.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = option;
    }
  }

  return closest.ratio;
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function generateImage(input: ImageGenerationInput): Promise<GeneratedImage> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not set');
  }

  const parts: GeminiPart[] = [
    { text: CHARACTER_PROMPT },
    {
      inlineData: {
        mimeType: input.characterImageMimeType,
        data: input.characterImage,
      },
    },
    {
      inlineData: {
        mimeType: input.touristPhotoMimeType,
        data: input.touristPhoto,
      },
    },
  ];

  const requestBody = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: input.aspectRatio,
      },
    },
  };

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = (await response.json()) as GeminiResponse;

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message} (code: ${data.error.code})`);
  }

  const imagePart = data.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.mimeType?.startsWith('image/')
  );

  if (!imagePart?.inlineData) {
    throw new Error('No image generated in response');
  }

  return {
    data: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
    prompt: CHARACTER_PROMPT,
    generatedAt: new Date(),
  };
}

// 画像キャッシュ（一度読み込んだ画像はメモリに保持）
const imageCache = new Map<string, { data: string; mimeType: string }>();

export async function loadImageAsBase64(
  url: string,
  maxRetries = 3
): Promise<{ data: string; mimeType: string }> {
  // キャッシュにあればそれを返す
  const cached = imageCache.get(url);
  if (cached) {
    return cached;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const blob = await response.blob();
      const mimeType = blob.type;

      const result = await new Promise<{ data: string; mimeType: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve({ data: base64, mimeType });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // キャッシュに保存
      imageCache.set(url, result);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // リトライ前に少し待機（指数バックオフ）
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw new Error(`画像の読み込みに失敗しました: ${lastError?.message ?? 'Unknown error'}`);
}

export function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({ data: base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
