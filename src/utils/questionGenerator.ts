import type { RecallQuestion } from '@/components/RecallPrompt';

// Simple question templates for generating comprehension questions
const questionTemplates = {
  'multiple-choice': [
    {
      pattern: /\b(\w+) is (\w+)/gi,
      template: (subject: string, predicate: string) => ({
        question: `What is ${subject}?`,
        options: [predicate, 'unknown', 'not mentioned', 'unclear'],
        correctAnswer: predicate,
        explanation: `The text states that ${subject} is ${predicate}.`,
      }),
    },
    {
      pattern: /\b(\w+) can (\w+)/gi,
      template: (subject: string, action: string) => ({
        question: `What can ${subject} do?`,
        options: [action, 'nothing', 'everything', 'unclear'],
        correctAnswer: action,
        explanation: `According to the text, ${subject} can ${action}.`,
      }),
    },
  ],
  'true-false': [
    {
      pattern: /\b(\w+) (?:is|are) (?:very|extremely|quite) (\w+)/gi,
      template: (subject: string, adjective: string) => ({
        question: `${subject} is ${adjective}.`,
        correctAnswer: 'True',
        explanation: `The text describes ${subject} as ${adjective}.`,
      }),
    },
    {
      pattern: /\b(\w+) (?:cannot|can't|will not|won't) (\w+)/gi,
      template: (subject: string, action: string) => ({
        question: `${subject} can ${action}.`,
        correctAnswer: 'False',
        explanation: `The text states that ${subject} cannot ${action}.`,
      }),
    },
  ],
};

// Fallback questions when pattern matching fails
const fallbackQuestions: RecallQuestion[] = [
  {
    id: 'comprehension-1',
    type: 'true-false',
    question: 'Did you understand the main point of this section?',
    correctAnswer: 'True',
    explanation: 'Great! Understanding the main points is key to effective reading.',
  },
  {
    id: 'attention-1',
    type: 'true-false',
    question: 'Were you paying attention while reading this section?',
    correctAnswer: 'True',
    explanation: 'Staying focused while reading helps with comprehension and retention.',
  },
  {
    id: 'retention-1',
    type: 'multiple-choice',
    question: 'How would you rate your understanding of this section?',
    options: ['Very clear', 'Somewhat clear', 'Unclear', 'Completely lost'],
    correctAnswer: 'Very clear',
    explanation: "Clear understanding shows you're engaging well with the material.",
  },
  {
    id: 'engagement-1',
    type: 'true-false',
    question: 'Can you summarize what you just read in your own words?',
    correctAnswer: 'True',
    explanation: 'Being able to summarize shows strong comprehension skills.',
  },
];

/**
 * Generate a recall question from a text chunk
 */
export function generateRecallQuestion(text: string, chunkIndex: number): RecallQuestion {
  const questionId = `chunk-${chunkIndex}-${Date.now()}`;

  // Try to generate questions from text patterns
  for (const type of ['true-false', 'multiple-choice'] as const) {
    const templates = questionTemplates[type];

    for (const template of templates) {
      const matches = [...text.matchAll(template.pattern)];

      if (matches.length > 0) {
        const match = matches[0];
        const questionData = template.template(
          match[1]?.toLowerCase() || 'subject',
          match[2]?.toLowerCase() || 'predicate'
        );

        return {
          id: questionId,
          type,
          ...questionData,
        };
      }
    }
  }

  // If no patterns match, use a fallback question
  const fallback = fallbackQuestions[chunkIndex % fallbackQuestions.length];

  return {
    ...fallback,
    id: questionId,
  };
}

/**
 * Generate questions based on keywords found in the text
 */
export function generateKeywordQuestion(
  text: string,
  keywords: string[],
  chunkIndex: number
): RecallQuestion {
  const questionId = `keyword-${chunkIndex}-${Date.now()}`;

  if (keywords.length === 0) {
    return generateRecallQuestion(text, chunkIndex);
  }

  const keyword = keywords[0];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
  const keywordSentence = sentences.find((s) => s.toLowerCase().includes(keyword.toLowerCase()));

  if (keywordSentence) {
    // Create a true/false question about the keyword
    return {
      id: questionId,
      type: 'true-false',
      question: `The text mentions "${keyword}".`,
      correctAnswer: 'True',
      explanation: `Yes, "${keyword}" is mentioned in the text.`,
    };
  }

  // Create a multiple choice question about keywords
  const randomKeywords = [...keywords].sort(() => Math.random() - 0.5).slice(0, 4);

  return {
    id: questionId,
    type: 'multiple-choice',
    question: 'Which of these terms was mentioned in the text?',
    options: randomKeywords,
    correctAnswer: keyword,
    explanation: `"${keyword}" was highlighted as a key term in this section.`,
  };
}

/**
 * Determine if a recall prompt should be shown for this chunk
 */
export function shouldShowRecallPrompt(
  chunkIndex: number,
  totalChunks: number,
  userPreferences = { frequency: 'normal' }
): boolean {
  // Show prompts based on frequency preference
  switch (userPreferences.frequency) {
    case 'high':
      return true; // Every chunk
    case 'low':
      return chunkIndex % 3 === 0; // Every 3rd chunk
    case 'normal':
    default:
      return chunkIndex % 2 === 0; // Every 2nd chunk
  }
}
