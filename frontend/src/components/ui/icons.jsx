// Small inline icon set - no external icon library dependency, same
// stroke-based style as the eye icon in PasswordInput. Used wherever an
// icon-only button needs a visual (table row actions, navbar toggle).

const base = 'h-4 w-4';

export const EditIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={base}>
    <path
      d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PauseCircleIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={base}>
    <circle cx="12" cy="12" r="10" />
    <path d="M10 9v6M14 9v6" strokeLinecap="round" />
  </svg>
);

export const PlayCircleIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={base}>
    <circle cx="12" cy="12" r="10" />
    <path d="M10 8.5v7l6-3.5-6-3.5Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TrashIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={base}>
    <path
      d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const MenuIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
  </svg>
);

export const CloseIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
  </svg>
);
