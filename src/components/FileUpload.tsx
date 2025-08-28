'use client';

import { useRef, useState } from 'react';

interface FileUploadProps {
  onFileContent: (content: string) => void;
  accept?: string;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileContent,
  accept = '.pdf,.txt',
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      if (file.type === 'text/plain') {
        // Handle text files
        const text = await file.text();
        onFileContent(text);
      } else if (file.type === 'application/pdf') {
        // For now, show a message that PDF support is coming
        // TODO: Implement PDF text extraction in future phase
        setUploadError('PDF support coming soon! Please use copy-paste for now.');
      } else {
        setUploadError('Unsupported file type. Please use .txt files or copy-paste your content.');
      }
    } catch (error) {
      console.error('Error reading file:', error);
      setUploadError('Error reading file. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className='space-y-2'>
      <input
        ref={fileInputRef}
        type='file'
        accept={accept}
        onChange={handleFileChange}
        className='hidden'
        disabled={disabled || isUploading}
        aria-label='File upload input'
      />

              <button
          onClick={handleFileSelect}
          disabled={disabled || isUploading}
          className='w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg group'
        >
          <div className='space-y-4'>
            <div className='text-4xl transform group-hover:scale-110 transition-transform duration-300'>
              {isUploading ? '⏳' : '📁'}
            </div>
            <div>
              <div className='text-lg font-semibold text-gray-700 mb-1'>
                {isUploading ? 'Processing your file...' : 'Drop your file here'}
              </div>
              <div className='text-sm text-gray-500'>
                {isUploading ? 'Please wait while we process your content' : 'Support for .txt files • PDF coming soon'}
              </div>
            </div>
            {!isUploading && (
              <div className='inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium'>
                <span>Browse Files</span>
              </div>
            )}
          </div>
        </button>

      {uploadError && (
        <div className='text-sm text-red-600 bg-red-50 p-3 rounded-lg'>{uploadError}</div>
      )}
    </div>
  );
};

export default FileUpload;
