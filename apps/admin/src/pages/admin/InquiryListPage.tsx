import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInquiries, type Inquiry } from '../../api/inquiry';
import { clearTokens } from '../../store/auth';

type StatusFilter = 'all' | 'pending' | 'answered';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '답변 대기' },
  { value: 'answered', label: '답변 완료' },
];

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function InquiryListPage() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getInquiries(statusFilter === 'all' ? undefined : statusFilter)
      .then(({ data }) => setInquiries(data.items))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [statusFilter]);

  const handleLogout = () => {
    clearTokens();
    navigate('/login', { replace: true });
  };

  const pendingCount = inquiries.filter(i => i.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">errander 어드민</h1>
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">1:1 문의</h2>
        </div>

        {/* 탭 필터 */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">문의가 없어요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map(inquiry => (
              <button
                key={inquiry.inquiryId}
                onClick={() => navigate(`/admin/inquiries/${inquiry.inquiryId}`, { state: { inquiry } })}
                className="w-full bg-white rounded-2xl p-5 text-left border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          inquiry.status === 'pending'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-green-50 text-green-600'
                        }`}
                      >
                        {inquiry.status === 'pending' ? '답변 대기' : '답변 완료'}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 truncate">{inquiry.title}</p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{inquiry.content}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{formatDate(inquiry.createdAt)}</p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">{inquiry.userId.slice(0, 8)}…</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
