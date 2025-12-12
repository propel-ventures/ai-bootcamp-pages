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
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-[#0b1035] mb-4">Quiz Complete!</h3>
        <p className="text-lg mb-4">
          You got <span className="font-bold text-[#2254FE]">{correctCount}</span> out of{' '}
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
          className="px-5 py-2.5 bg-[#0b1035] text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
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
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500 font-medium">
          Question {currentQuestion + 1} of {questions.length}
        </span>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === currentQuestion
                  ? 'bg-[#2254FE]'
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

      <h3 className="text-lg font-medium text-[#0b1035] mb-4">{question.question}</h3>

      <div className="space-y-3 mb-6">
        {question.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={isSubmitted}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
              isSubmitted
                ? i === question.answer
                  ? 'bg-green-50 border-green-500'
                  : selectedAnswers[currentQuestion] === i
                  ? 'bg-red-50 border-red-500'
                  : 'bg-gray-50 border-gray-200'
                : selectedAnswers[currentQuestion] === i
                ? 'bg-[#73DEFF]/10 border-[#73DEFF]'
                : 'bg-gray-50 border-gray-200 hover:bg-[#f4f6fa] hover:border-[#73DEFF]/50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {isSubmitted && (
        <div
          className={`mb-4 p-4 rounded-xl ${
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
            className={`px-5 py-2.5 rounded-lg transition-all duration-200 font-medium ${
              isAnswered
                ? 'bg-[#f9a500] text-white hover:bg-opacity-90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-5 py-2.5 bg-[#2254FE] text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  );
}
