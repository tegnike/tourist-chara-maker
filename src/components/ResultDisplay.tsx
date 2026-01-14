import type { GeneratedImage } from '../types';

interface ResultDisplayProps {
  result: GeneratedImage;
}

export function ResultDisplay({ result }: ResultDisplayProps) {
  const imageUrl = `data:${result.mimeType};base64,${result.data}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `tourist-chara-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">生成結果</h3>
      <div className="rounded-lg overflow-hidden bg-gray-100 shadow-lg">
        <img src={imageUrl} alt="Generated" className="w-full h-auto" />
      </div>
      <button
        onClick={handleDownload}
        className="w-full py-3 px-6 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 active:bg-green-800 transition-all duration-200"
      >
        ダウンロード
      </button>
    </div>
  );
}
