import React, { useState } from 'react';
import { Question } from '../../types';
import { useAuctions } from '../../context/AuctionContext';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Send, Reply, Flag, CheckCircle, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface QASectionProps {
  auctionId: string;
  sellerId: string;
}

export const QASection: React.FC<QASectionProps> = ({ auctionId, sellerId }) => {
  const { getQuestionsForAuction, askQuestion, answerQuestion } = useAuctions();
  const { currentUser } = useAuth();
  const questions = getQuestionsForAuction(auctionId);

  const [questionText, setQuestionText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const isSeller = currentUser?.id === sellerId;

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please sign in with campus email to ask questions.');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await askQuestion(auctionId, questionText);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to submit question');
    } else {
      setQuestionText('');
    }
  };

  const handleAnswerQuestion = async (qId: string) => {
    if (!currentUser) return;
    setError(null);
    setLoading(true);
    const res = await answerQuestion(qId, replyText);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to submit answer');
    } else {
      setReplyText('');
      setReplyingToId(null);
    }
  };

  const handleReport = (id: string) => {
    setReportedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-600" />
          <h3 className="text-base font-bold text-slate-900">Questions & Answers</h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
            {questions.length}
          </span>
        </div>
      </div>

      {/* Ask Question Box (for non-sellers) */}
      {!isSeller && (
        <form onSubmit={handleAskQuestion} className="bg-surface-100 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <label htmlFor="qa-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Have a question about condition, warranty or pickup location?
              </label>
              <textarea
                id="qa-input"
                rows={2}
                maxLength={500}
                value={questionText}
                onChange={(e) => {
                  setQuestionText(e.target.value);
                  setError(null);
                }}
                placeholder="Ask the seller a question (min. 5 chars)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm bg-white"
                required
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>Keep questions respectful and campus-appropriate</span>
                <span>{questionText.length} / 500</span>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || questionText.trim().length < 5}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? 'Posting...' : 'Ask Seller'}
            </button>
          </div>
        </form>
      )}

      {/* Questions list */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500">No questions asked yet.</p>
          </div>
        ) : (
          questions.map((q) => (
            <div key={q.id} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              {/* Question */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {q.asker_pseudonym || 'Campus Student'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 mt-1 leading-relaxed">
                    {q.question_text}
                  </p>
                </div>

                <button
                  onClick={() => handleReport(q.id)}
                  className="text-slate-400 hover:text-red-500 p-1"
                  title="Report question"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Seller Answer */}
              {q.answer ? (
                <div className="ml-3 pl-3 border-l-2 border-brand-500 bg-brand-50/40 p-3 rounded-r-xl space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-900">Seller Answer:</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDistanceToNow(new Date(q.answer.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {q.answer.answer_text}
                  </p>
                </div>
              ) : isSeller ? (
                // Seller can reply
                <div className="ml-3 pt-1">
                  {replyingToId === q.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        maxLength={1000}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your official seller response..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyingToId(null)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAnswerQuestion(q.id)}
                          disabled={replyText.trim().length < 2 || loading}
                          className="px-3 py-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg flex items-center gap-1"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingToId(q.id)}
                      className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      Reply as Seller
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic ml-3">
                  Awaiting seller response...
                </p>
              )}

              {reportedIds.has(q.id) && (
                <div className="p-2 bg-slate-100 text-slate-600 text-[11px] rounded-lg flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  Report flagged for campus moderator review.
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
