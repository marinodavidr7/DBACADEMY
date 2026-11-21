import React from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { CourseQuizQuestion } from '../../types';
import {
  createEmptyOption,
  createEmptyQuestion,
  isQuestionValid,
  moveItem,
  validateQuestion,
} from '../../utils/courseEditor';
import { Field } from './Field';

interface QuizBuilderProps {
  questions: CourseQuizQuestion[];
  enabled: boolean;
  onChange: (questions: CourseQuizQuestion[]) => void;
  onEnabledChange: (enabled: boolean) => void;
  labels: {
    title: string;
    enabled: string;
    addQuestion: string;
    question: string;
    prompt: string;
    explanation: string;
    explanationPlaceholder: string;
    multiple: string;
    addOption: string;
    removeOption: string;
    correct: string;
    moveUp: string;
    moveDown: string;
    removeQuestion: string;
    optionLabel: string;
    minOptions: string;
    oneCorrect: string;
    multipleCorrect: string;
    emptyPrompt: string;
    emptyOption: string;
  };
}

function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({
  questions,
  enabled,
  onChange,
  onEnabledChange,
  labels,
}) => {
  const updateQuestion = (questionId: string, patch: Partial<CourseQuizQuestion>) => {
    onChange(questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q)));
  };

  const updateOption = (questionId: string, optionId: string, text: string) => {
    onChange(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)) }
          : q
      )
    );
  };

  const toggleCorrect = (questionId: string, index: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    const selected = question.correctIndexes.includes(index);
    if (question.multiple) {
      updateQuestion(questionId, {
        correctIndexes: selected
          ? question.correctIndexes.filter((i) => i !== index)
          : [...question.correctIndexes, index].sort((a, b) => a - b),
      });
    } else {
      updateQuestion(questionId, { correctIndexes: selected ? [] : [index] });
    }
  };

  const removeOption = (questionId: string, optionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question || question.options.length <= 2) return;
    const index = question.options.findIndex((o) => o.id === optionId);
    updateQuestion(questionId, {
      options: question.options.filter((o) => o.id !== optionId),
      correctIndexes: question.correctIndexes
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i)),
    });
  };

  const addOption = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question || question.options.length >= 8) return;
    updateQuestion(questionId, {
      options: [...question.options, createEmptyOption()],
    });
  };

  const addQuestion = () => {
    onChange([...questions, createEmptyQuestion()]);
  };

  const removeQuestion = (questionId: string) => {
    if (questions.length <= 1) return;
    onChange(questions.filter((q) => q.id !== questionId));
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    onChange(moveItem(questions, index, index + direction));
  };

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{labels.title}</h4>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {questions.length} {labels.question.toLowerCase()}
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
            className="h-4 w-4 rounded accent-blue-600"
          />
          {labels.enabled}
        </label>
      </div>

      {enabled && (
        <div className="space-y-4">
          {questions.map((question, questionIndex) => {
            const validation = validateQuestion(question);
            const valid = isQuestionValid(question);
            return (
              <div
                key={question.id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {labels.question} {questionIndex + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveQuestion(questionIndex, -1)}
                      disabled={questionIndex === 0}
                      title={labels.moveUp}
                      aria-label={labels.moveUp}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(questionIndex, 1)}
                      disabled={questionIndex === questions.length - 1}
                      title={labels.moveDown}
                      aria-label={labels.moveDown}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      disabled={questions.length <= 1}
                      title={labels.removeQuestion}
                      aria-label={labels.removeQuestion}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <Field
                  label={labels.prompt}
                  error={
                    validation.promptError === 'empty-prompt' ? labels.emptyPrompt : undefined
                  }
                >
                  <input
                    value={question.prompt}
                    onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </Field>

                <Field
                  label={labels.explanation}
                  help={labels.explanationPlaceholder}
                >
                  <textarea
                    value={question.explanation}
                    onChange={(event) => updateQuestion(question.id, { explanation: event.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </Field>

                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={question.multiple}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        multiple: event.target.checked,
                        correctIndexes: event.target.checked
                          ? question.correctIndexes
                          : question.correctIndexes.slice(0, 1),
                      })
                    }
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                  {labels.multiple}
                </label>

                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const checked = question.correctIndexes.includes(optionIndex);
                    const optionError = validation.optionErrors[optionIndex];
                    return (
                      <div key={option.id} className="flex items-center gap-2">
                        <input
                          type={question.multiple ? 'checkbox' : 'radio'}
                          name={`correct-${question.id}`}
                          checked={checked}
                          onChange={() => toggleCorrect(question.id, optionIndex)}
                          title={labels.correct}
                          aria-label={`${labels.correct}: ${optionLetter(optionIndex)}`}
                          className={`h-4 w-4 shrink-0 ${question.multiple ? 'rounded' : ''} accent-emerald-600`}
                        />
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-bold ${
                            checked
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {optionLetter(optionIndex)}
                        </span>
                        <input
                          value={option.text}
                          onChange={(event) => updateOption(question.id, option.id, event.target.value)}
                          placeholder={`${labels.optionLabel} ${optionLetter(optionIndex)}`}
                          className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm ${
                            optionError
                              ? 'border-red-400 dark:border-red-700'
                              : 'border-slate-200 dark:border-slate-700'
                          } bg-white dark:bg-slate-900`}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(question.id, option.id)}
                          disabled={question.options.length <= 2}
                          title={labels.removeOption}
                          aria-label={labels.removeOption}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => addOption(question.id)}
                    disabled={question.options.length >= 8}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {labels.addOption}
                  </button>
                  {validation.optionsError && (
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                      {labels.minOptions}
                    </span>
                  )}
                  {validation.correctError && (
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                      {question.multiple ? labels.multipleCorrect : labels.oneCorrect}
                    </span>
                  )}
                </div>

                {!valid && !validation.promptError && !validation.optionsError && !validation.correctError && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    {labels.emptyOption}
                  </p>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/60"
          >
            <Plus className="h-3.5 w-3.5" />
            {labels.addQuestion}
          </button>
        </div>
      )}
    </section>
  );
};
