interface StateBlockProps {
  title: string;
  description?: string;
}

export function StateBlock({ title, description }: StateBlockProps) {
  return (
    <div className="px-6 py-20 text-center">
      <p className="text-sm font-semibold text-[#6B7280]">{title}</p>
      {description ? <p className="mt-2 text-xs text-[#9CA3AF]">{description}</p> : null}
    </div>
  );
}
