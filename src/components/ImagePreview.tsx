interface ImagePreviewProps {
  src: string;
  alt: string;
  onRemove?: () => void;
}

export function ImagePreview({ src, alt, onRemove }: ImagePreviewProps) {
  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-100">
      <img src={src} alt={alt} className="w-full h-auto object-contain max-h-64" />
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          aria-label="Remove image"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
