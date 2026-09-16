import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { MenuIcon, CloseIcon } from '../ui/icons';

// Reusable top nav for admin/super-admin pages. `children` are page-specific
// action buttons rendered before the always-present Log out - the navbar
// itself doesn't know what those actions are. `onMenuClick`, if given,
// renders a sidebar-toggle button next to the brand - separate from this
// navbar's own mobile-only action menu toggle below.
export default function Navbar({ children, onMenuClick }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open sidebar"
              className="rounded-field p-1.5 text-text hover:bg-border/50"
            >
              {MenuIcon}
            </button>
          )}
          <span className="text-lg font-semibold text-text">hqhb</span>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          {children}
          <Button variant="ghost" className="w-auto" onClick={logout}>
            Log out
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="rounded-field p-1.5 text-text hover:bg-border/50 sm:hidden"
        >
          {open ? CloseIcon : MenuIcon}
        </button>
      </div>

      {open && (
        <div className="flex flex-col items-start gap-3 border-t border-border px-4 py-3 sm:hidden">
          {children}
          <Button variant="ghost" className="w-auto" onClick={logout}>
            Log out
          </Button>
        </div>
      )}
    </nav>
  );
}
