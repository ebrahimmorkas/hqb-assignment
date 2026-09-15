import { useState } from 'react';
import Input from './Input';

const EyeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path
      d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-7-11-7a20.3 20.3 0 0 1 4.22-5.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a20.3 20.3 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M1 1l22 22" strokeLinecap="round" />
  </svg>
);

// Same look as Input, but for a password field specifically - always the
// eye-toggle, regardless of where it's used (login, create/edit user form).
// eslint-disable-next-line no-unused-vars -- swallow an incoming `type`
// (e.g. FormField always passes type="password" through) so it can't
// override the visibility toggle below.
export default function PasswordInput({ className = '', type, ...rest }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={`pr-10 ${className}`} {...rest} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text"
      >
        {visible ? EyeOffIcon : EyeIcon}
      </button>
    </div>
  );
}
