const TONES = {
  gray: 'bg-border/60 text-text',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success-bg text-success',
};

export default function Badge({ children, tone = 'gray' }) {
  return (
    <span className={`inline-block rounded-field px-2 py-0.5 text-xs font-medium capitalize ${TONES[tone]}`}>
      {children}
    </span>
  );
}
