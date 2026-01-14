import { ImageUploader } from './components/ImageUploader';
import { ImagePreview } from './components/ImagePreview';
import { GenerateButton } from './components/GenerateButton';
import { ResultDisplay } from './components/ResultDisplay';
import { useImageGeneration } from './hooks/useImageGeneration';

function App() {
  const {
    touristPhotoPreview,
    detectedAspectRatio,
    result,
    isLoading,
    error,
    wasInterrupted,
    setTouristPhoto,
    clearTouristPhoto,
    generate,
    clearInterruptedFlag,
  } = useImageGeneration();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pink-600 mb-2">ニケちゃん観光Now!</h1>
          <p className="text-gray-600">観光写真にニケちゃんを合成します</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左側: 入力エリア */}
          <div className="flex-1 bg-white rounded-xl shadow-lg p-6 space-y-6">
            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">観光写真をアップロード</h2>
              {touristPhotoPreview ? (
                <div className="space-y-3">
                  <ImagePreview
                    src={touristPhotoPreview}
                    alt="Tourist photo"
                    onRemove={clearTouristPhoto}
                  />
                  {detectedAspectRatio && (
                    <p className="text-sm text-gray-500">
                      検出されたアスペクト比: <span className="font-medium">{detectedAspectRatio}</span>
                    </p>
                  )}
                </div>
              ) : (
                <ImageUploader
                  onImageSelect={setTouristPhoto}
                  label="観光写真をアップロード"
                  accept="image/*"
                />
              )}
            </section>

            {wasInterrupted && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">前回の生成が中断されました</p>
                  <p className="text-sm">観光写真は復元されています。再度生成ボタンを押してください。</p>
                </div>
                <button
                  onClick={clearInterruptedFlag}
                  className="text-amber-500 hover:text-amber-700 ml-4"
                  aria-label="閉じる"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <GenerateButton
              onClick={generate}
              isLoading={isLoading}
              disabled={!touristPhotoPreview}
            />
          </div>

          {/* 右側: 結果エリア */}
          <div className="flex-1 bg-white rounded-xl shadow-lg p-6">
            {result ? (
              <ResultDisplay result={result} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg
                    className="mx-auto h-16 w-16 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p>生成結果がここに表示されます</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="text-center mt-8 text-sm text-gray-500">
          Powered by Google Gemini 3 Pro Image API
        </footer>
      </div>
    </div>
  );
}

export default App;
