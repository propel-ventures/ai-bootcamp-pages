import { useState, useEffect } from 'react';

interface Question {
  question: string;
  options: string[];
  answer: number;
}

interface QuizProps {
  questions: Question[];
  moduleId: string;
}

export default function Quiz({ questions, moduleId }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState<boolean[]>(
    new Array(questions.length).fill(false)
  );

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(`quiz-${moduleId}`);
    if (saved) {
      const { answers, completed } = JSON.parse(saved);
      setSelectedAnswers(answers);
      setSubmitted(completed);
      if (completed.every((c: boolean) => c)) {
        setShowResults(true);
      }
    }
  }, [moduleId]);

  // Save progress
  useEffect(() => {
    localStorage.setItem(
      `quiz-${moduleId}`,
      JSON.stringify({ answers: selectedAnswers, completed: submitted })
    );
  }, [selectedAnswers, submitted, moduleId]);

  const handleSelect = (optionIndex: number) => {
    if (submitted[currentQuestion]) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const newSubmitted = [...submitted];
    newSubmitted[currentQuestion] = true;
    setSubmitted(newSubmitted);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setSelectedAnswers(new Array(questions.length).fill(null));
    setSubmitted(new Array(questions.length).fill(false));
    setCurrentQuestion(0);
    setShowResults(false);
    localStorage.removeItem(`quiz-${moduleId}`);
  };

  const correctCount = selectedAnswers.filter(
    (answer, i) => answer === questions[i].answer
  ).length;

  if (showResults) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-[#1e3a5f] mb-4">Quiz Complete!</h3>
        <p className="text-lg mb-4">
          You got <span className="font-bold text-blue-600">{correctCount}</span> out of{' '}
          <span className="font-bold">{questions.length}</span> correct.
        </p>
        <div className="mb-6">
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              {selectedAnswers[i] === q.answer ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span className="text-sm text-gray-600">Question {i + 1}</span>
            </div>
          ))}
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isAnswered = selectedAnswers[currentQuestion] !== null;
  const isSubmitted = submitted[currentQuestion];
  const isCorrect = selectedAnswers[currentQuestion] === question.answer;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          Question {currentQuestion + 1} of {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === currentQuestion
                  ? 'bg-blue-600'
                  : submitted[i]
                  ? selectedAnswers[i] === questions[i].answer
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-4">{question.question}</h3>

      <div className="space-y-2 mb-6">
        {question.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={isSubmitted}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              isSubmitted
                ? i === question.answer
                  ? 'bg-green-100 border-green-500'
                  : selectedAnswers[currentQuestion] === i
                  ? 'bg-red-100 border-red-500'
                  : 'bg-gray-50 border-gray-200'
                : selectedAnswers[currentQuestion] === i
                ? 'bg-blue-100 border-blue-500'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {isSubmitted && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.options[question.answer]}`}
        </div>
      )}

      <div className="flex justify-end gap-3">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!isAnswered}
            className={`px-4 py-2 rounded transition-colors ${
              isAnswered
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  );
}
