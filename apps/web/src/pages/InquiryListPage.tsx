import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInquiries } from '../api/inquiries';
import { ScreenHeader } from '../components/ScreenHeader';
import { StateBlock } from '../components/StateBlock';

export function InquiryListPage() {
  const { t } = useTranslation();
  const { data: inquiries = [], isLoading, isError } = useInquiries();

  return (
    <main>
      <ScreenHeader
        title={t('inquiry.listTitle')}
        back
        centered
        border
        action={
          <Link to="/my/inquiries/new" className="rounded-full bg-[#F97316] px-3.5 py-2 text-sm font-bold text-white">
            {t('inquiry.write')}
          </Link>
        }
      />
      <section className="px-6 py-5">
        {isLoading ? <StateBlock title={t('inquiry.loading')} /> : null}
        {isError ? <StateBlock title={t('inquiry.loadError')} description={t('my.authNetworkHelp')} /> : null}
        {!isLoading && !isError && inquiries.length === 0 ? <StateBlock title={t('inquiry.empty')} /> : null}
        {inquiries.map((inquiry) => (
          <article key={inquiry.inquiryId} className="mb-3 rounded-[20px] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="min-w-0 flex-1 truncate font-bold">{inquiry.title}</h2>
              <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs font-semibold text-[#6B7280]">
                {inquiry.status === 'answered' ? t('inquiry.answered') : t('inquiry.pending')}
              </span>
            </div>
            <p className="line-clamp-2 text-sm leading-5 text-[#6B7280]">{inquiry.content}</p>
            {inquiry.answer ? <p className="mt-3 rounded-2xl bg-[#FFF7ED] p-3 text-sm leading-5 text-[#9A3412]">{inquiry.answer}</p> : null}
          </article>
        ))}
      </section>
    </main>
  );
}
