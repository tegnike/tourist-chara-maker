export interface GeneratedImage {
  data: string; // base64
  mimeType: string;
  prompt: string;
  generatedAt: Date;
}

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

export interface ImageGenerationInput {
  touristPhoto: string; // base64
  touristPhotoMimeType: string;
  characterImage: string; // base64
  characterImageMimeType: string;
  aspectRatio: string; // e.g., "16:9", "9:16"
}

export type AspectRatioOption =
  | '4:3' | '3:4'
  | '16:9' | '9:16'
  | '21:9' | '9:21'
  | '5:4' | '4:5'
  | '3:2' | '2:3'
  | '1:1';
