'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

export type QuestionType = 'multiple-choice' | 'true-false';

export interface RecallQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  explanation?: string;
}

interface RecallPromptProps {
  question: RecallQuestion;
  onAnswer: (isCorrect: boolean) => void;
  onSkip: () => void;
}

const RecallPrompt: React.FC<RecallPromptProps> = ({ question, onAnswer, onSkip }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    
    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct);
  };

  const handleContinue = () => {
    setSelectedAnswer('');
    setShowResult(false);
    setIsCorrect(false);
  };

  if (showResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className={`mb-4 text-6xl ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
              {isCorrect ? '🎉' : '🤔'}
            </div>
            
            <h3 className={`mb-4 text-2xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? 'Correct!' : 'Not quite right'}
            </h3>
            
            {!isCorrect && (
              <div className="mb-4 rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-800">Correct answer:</p>
                <p className="text-blue-700">{question.correctAnswer}</p>
              </div>
            )}
            
            {question.explanation && (
              <div className="mb-6 rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-800">Explanation:</p>
                <p className="text-gray-700">{question.explanation}</p>
              </div>
            )}
            
            <Button onClick={handleContinue} variant="primary" size="lg" className="w-full">
              Continue Reading
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mb-4 text-4xl">🤔</div>
          <h3 className="text-xl font-bold text-gray-800">Quick Comprehension Check</h3>
          <p className="text-gray-600">Did you get it?</p>
        </div>
        
        <div className="mb-6">
          <h4 className="mb-4 text-lg font-semibold text-gray-800">{question.question}</h4>
          
          <div className="space-y-3">
            {question.type === 'multiple-choice' && question.options ? (
              question.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex cursor-pointer items-center rounded-lg border-2 p-4 transition-all ${
                    selectedAnswer === option
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    className="mr-3 text-blue-500"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))
            ) : (
              // True/False questions
              <>
                <label
                  className={`flex cursor-pointer items-center rounded-lg border-2 p-4 transition-all ${
                    selectedAnswer === 'True'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value="True"
                    checked={selectedAnswer === 'True'}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    className="mr-3 text-green-500"
                  />
                  <span className="text-gray-700">True</span>
                </label>
                <label
                  className={`flex cursor-pointer items-center rounded-lg border-2 p-4 transition-all ${
                    selectedAnswer === 'False'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value="False"
                    checked={selectedAnswer === 'False'}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    className="mr-3 text-red-500"
                  />
                  <span className="text-gray-700">False</span>
                </label>
              </>
            )}
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={onSkip}
            variant="secondary"
            size="md"
            className="flex-1"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            size="md"
            className="flex-1"
            disabled={!selectedAnswer}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecallPrompt;
