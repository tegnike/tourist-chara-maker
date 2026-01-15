import { useState, useCallback, useEffect, useRef } from 'react';
import type { GeneratedImage, AspectRatioOption } from '../types';
import { generateImage, fileToBase64, loadImageAsBase64, getImageDimensions, findClosestAspectRatio } from '../services/gemini';

interface UseImageGenerationReturn {
  touristPhoto: File | null;
  touristPhotoPreview: string | null;
  detectedAspectRatio: AspectRatioOption | null;
  result: GeneratedImage | null;
  isLoading: boolean;
  error: string | null;
  wasInterrupted: boolean;
  setTouristPhoto: (file: File) => void;
  clearTouristPhoto: () => void;
  generate: () => Promise<void>;
  clearResult: () => void;
  clearInterruptedFlag: () => void;
}

const DEFAULT_CHARACTER_IMAGE = '/characters/character.png';
const STORAGE_KEY = 'tourist-chara-maker-state';

// localStorage保存用のデータ構造
interface StoredState {
  touristPhotoBase64: string | null;
  touristPhotoMimeType: string | null;
  touristPhotoName: string | null;
  detectedAspectRatio: AspectRatioOption | null;
  result: {
    data: string;
    mimeType: string;
    prompt: string;
    generatedAt: string; // ISO string
  } | null;
  isGenerating: boolean; // 生成中フラグ
}

// localStorageから状態を復元
function loadStoredState(): StoredState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // パースエラー時は無視
  }
  return null;
}

// localStorageに状態を保存
function saveState(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ストレージフル等のエラーは無視
  }
}

// localStorageの状態をクリア
function clearStoredState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // エラーは無視
  }
}

// base64文字列からFileオブジェクトを復元
function base64ToFile(base64: string, mimeType: string, fileName: string): File {
  const byteCharacters = atob(base64);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }
  const blob = new Blob([byteArray], { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
}

export function useImageGeneration(): UseImageGenerationReturn {
  const [touristPhoto, setTouristPhotoState] = useState<File | null>(null);
  const [touristPhotoPreview, setTouristPhotoPreview] = useState<string | null>(null);
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<AspectRatioOption | null>(null);
  const [result, setResult] = useState<GeneratedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasInterrupted, setWasInterrupted] = useState(false);

  // 現在の観光写真のbase64データを保持（localStorage保存用）
  const touristPhotoBase64Ref = useRef<{ data: string; mimeType: string } | null>(null);
  const isInitializedRef = useRef(false);

  // 初回マウント時にlocalStorageから状態を復元
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // キャラクター画像を事前に読み込んでキャッシュする（ネットワーク不安定時の対策）
    loadImageAsBase64(DEFAULT_CHARACTER_IMAGE).catch(() => {
      // プリロード失敗は無視（生成時に再試行される）
    });

    const stored = loadStoredState();
    if (!stored) return;

    // 生成中に中断された場合を検出
    if (stored.isGenerating) {
      setWasInterrupted(true);
      // 生成中フラグをリセットして保存
      saveState({ ...stored, isGenerating: false });
    }

    // 観光写真を復元
    if (stored.touristPhotoBase64 && stored.touristPhotoMimeType && stored.touristPhotoName) {
      try {
        const file = base64ToFile(
          stored.touristPhotoBase64,
          stored.touristPhotoMimeType,
          stored.touristPhotoName
        );
        setTouristPhotoState(file);
        const url = URL.createObjectURL(file);
        setTouristPhotoPreview(url);
        touristPhotoBase64Ref.current = {
          data: stored.touristPhotoBase64,
          mimeType: stored.touristPhotoMimeType,
        };
      } catch {
        // 復元失敗時は無視
      }
    }

    // アスペクト比を復元
    if (stored.detectedAspectRatio) {
      setDetectedAspectRatio(stored.detectedAspectRatio);
    }

    // 生成結果を復元
    if (stored.result) {
      setResult({
        data: stored.result.data,
        mimeType: stored.result.mimeType,
        prompt: stored.result.prompt,
        generatedAt: new Date(stored.result.generatedAt),
      });
    }
  }, []);

  // 状態が変化したらlocalStorageに保存
  useEffect(() => {
    // 初期化前は保存しない
    if (!isInitializedRef.current) return;

    const state: StoredState = {
      touristPhotoBase64: touristPhotoBase64Ref.current?.data ?? null,
      touristPhotoMimeType: touristPhotoBase64Ref.current?.mimeType ?? null,
      touristPhotoName: touristPhoto?.name ?? null,
      detectedAspectRatio,
      result: result ? {
        data: result.data,
        mimeType: result.mimeType,
        prompt: result.prompt,
        generatedAt: result.generatedAt.toISOString(),
      } : null,
      isGenerating: isLoading,
    };
    saveState(state);
  }, [touristPhoto, detectedAspectRatio, result, isLoading]);

  const setTouristPhoto = useCallback(async (file: File) => {
    setTouristPhotoState(file);
    const url = URL.createObjectURL(file);
    setTouristPhotoPreview(url);
    setResult(null);
    setError(null);
    setWasInterrupted(false);

    try {
      // async-parallel: fileToBase64とgetImageDimensionsは独立しているため並列実行
      const [base64Data, dimensions] = await Promise.all([
        fileToBase64(file),
        getImageDimensions(file),
      ]);

      // base64データを保持（localStorage保存用）
      touristPhotoBase64Ref.current = {
        data: base64Data.data,
        mimeType: base64Data.mimeType,
      };

      const aspectRatio = findClosestAspectRatio(dimensions.width, dimensions.height);
      setDetectedAspectRatio(aspectRatio);
    } catch {
      setDetectedAspectRatio(null);
      touristPhotoBase64Ref.current = null;
    }
  }, []);

  const clearTouristPhoto = useCallback(() => {
    if (touristPhotoPreview) {
      URL.revokeObjectURL(touristPhotoPreview);
    }
    setTouristPhotoState(null);
    setTouristPhotoPreview(null);
    setDetectedAspectRatio(null);
    setResult(null);
    setError(null);
    setWasInterrupted(false);
    touristPhotoBase64Ref.current = null;
    clearStoredState();
  }, [touristPhotoPreview]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setWasInterrupted(false);
  }, []);

  const clearInterruptedFlag = useCallback(() => {
    setWasInterrupted(false);
  }, []);

  const generate = useCallback(async () => {
    if (!touristPhoto || !detectedAspectRatio) {
      setError('観光写真を選択してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [touristPhotoData, characterImageData] = await Promise.all([
        fileToBase64(touristPhoto),
        loadImageAsBase64(DEFAULT_CHARACTER_IMAGE),
      ]);

      const generatedImage = await generateImage({
        touristPhoto: touristPhotoData.data,
        touristPhotoMimeType: touristPhotoData.mimeType,
        characterImage: characterImageData.data,
        characterImageMimeType: characterImageData.mimeType,
        aspectRatio: detectedAspectRatio,
      });

      setResult(generatedImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [touristPhoto, detectedAspectRatio]);

  return {
    touristPhoto,
    touristPhotoPreview,
    detectedAspectRatio,
    result,
    isLoading,
    error,
    wasInterrupted,
    setTouristPhoto,
    clearTouristPhoto,
    generate,
    clearResult,
    clearInterruptedFlag,
  };
}
