'use client';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter your text here...',
  disabled = false,
}) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const wordCount = value
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return (
    <div className='space-y-2'>
      <div className='flex justify-between items-center'>
        <label className='block text-sm font-medium text-gray-700'>Reading Text</label>
        <span className='text-sm text-gray-500'>{wordCount} words</span>
      </div>

      <textarea
        value={value}
        onChange={handleTextChange}
        placeholder={placeholder}
        disabled={disabled}
        className='w-full h-48 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth disabled:bg-gray-50 disabled:cursor-not-allowed'
        aria-label='Text input for reading content'
      />

      {wordCount > 0 && (
        <div className='text-xs text-gray-500'>
          Estimated reading time: {Math.ceil(wordCount / 200)} minutes
        </div>
      )}
    </div>
  );
};

export default TextInput;
