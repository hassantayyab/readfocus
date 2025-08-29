'use client';

import { useRef, useState } from 'react';

interface FileUploadProps {
  onFileContent: (content: string) => void;
  accept?: string;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileContent,
  accept = '.txt,.pdf',
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const content = await file.text();
        onFileContent(content);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // TODO: Implement PDF parsing
        setUploadError('PDF support coming soon! Please use .txt files for now.');
      } else {
        setUploadError('Unsupported file type. Please use .txt or .pdf files.');
      }
    } catch (error) {
      setUploadError('Error reading file. Please try again.');
      console.error('File upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
        aria-label="File upload input"
      />

      <button
        onClick={handleFileSelect}
        disabled={disabled || isUploading}
        className="group w-full rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center transition-all duration-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="space-y-4">
          <div className="transform text-4xl transition-transform duration-300 group-hover:scale-110">
            {isUploading ? '⏳' : '📁'}
          </div>
          <div>
            <div className="mb-1 text-lg font-semibold text-gray-700">
              {isUploading ? 'Processing your file...' : 'Drop your file here'}
            </div>
            <div className="text-sm text-gray-500">
              {isUploading
                ? 'Please wait while we process your content'
                : 'Support for .txt files • PDF coming soon'}
            </div>
          </div>
          {!isUploading && (
            <div className="inline-flex items-center rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
              <span>Browse Files</span>
            </div>
          )}
        </div>
      </button>

      {uploadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {uploadError}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
