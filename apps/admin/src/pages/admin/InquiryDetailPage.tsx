import { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { answerInquiry, type Inquiry } from '../../api/inquiry';

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function InquiryDetailPage() {
  const navigate = useNavigate();
  const { inquiryId } = useParams<{ inquiryId: string }>();
  const location = useLocation();

  const [inquiry, setInquiry] = useState<Inquiry>(location.state?.inquiry);
  const [answer, setAnswer] = useState(inquiry?.answer ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!inquiry || !inquiryId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">문의를 찾을 수 없어요.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      await answerInquiry(inquiryId, answer.trim());
      setInquiry(prev => ({ ...prev, status: 'answered', answer: answer.trim() }));
    } catch {
      setError('답변 제출에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAnswered = inquiry.status === 'answered';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ‹
          </button>
          <h1 className="text-base font-semibold text-gray-900">문의 상세</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {/* 문의 카드 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                isAnswered ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              {isAnswered ? '답변 완료' : '답변 대기'}
            </span>
            <span className="text-xs text-gray-400 ml-auto">{formatDate(inquiry.createdAt)}</span>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-3">{inquiry.title}</h2>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{inquiry.content}</p>

          {inquiry.photoUrls && inquiry.photoUrls.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2">첨부 사진 ({inquiry.photoUrls.length}장)</p>
              <div className="flex flex-wrap gap-2">
                {inquiry.photoUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt={`첨부 사진 ${i + 1}`}
                      className="w-24 h-24 object-cover rounded-xl border border-gray-100 hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-mono">userId: {inquiry.userId}</p>
          </div>
        </div>

        {/* 답변 영역 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {isAnswered ? '답변 내용' : '답변 작성'}
          </h3>

          {isAnswered ? (
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{inquiry.answer}</p>
              <p className="text-xs text-gray-400 mt-3">{formatDate(inquiry.updatedAt)}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="답변 내용을 입력하세요..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <button
                type="submit"
                disabled={!answer.trim() || isSubmitting}
                className="mt-3 w-full py-3 rounded-xl font-semibold text-white text-sm transition-colors disabled:bg-gray-200 disabled:text-gray-400 bg-orange-500 hover:bg-orange-600"
              >
                {isSubmitting ? '제출 중...' : '답변 제출'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
