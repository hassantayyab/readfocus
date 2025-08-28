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
        className='w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed'
      >
        <div className='space-y-2'>
          <div className='text-3xl'>📁</div>
          <div className='text-sm font-medium text-gray-700'>
            {isUploading ? 'Processing file...' : 'Upload Text File'}
          </div>
          <div className='text-xs text-gray-500'>Support for .txt files (PDF coming soon)</div>
        </div>
      </button>

      {uploadError && (
        <div className='text-sm text-red-600 bg-red-50 p-3 rounded-lg'>{uploadError}</div>
      )}
    </div>
  );
};

export default FileUpload;
