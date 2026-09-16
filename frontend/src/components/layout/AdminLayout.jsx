import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useSidebar } from '../../context/SidebarContext';
import { useSidebarItems } from '../../hooks/useSidebarItems';

// The shared shell for every admin/super-admin page (UsersPage,
// CreateUserPage, EditUserPage, FindUserActionPage) - guarantees the
// sidebar is always present and consistent (open/closed state lives in
// SidebarContext, not here, so it survives navigating between pages).
export default function AdminLayout({ title, children, navbarActions, maxWidth = 'max-w-5xl' }) {
  const { open, setOpen } = useSidebar();
  const sidebarItems = useSidebarItems();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={open} items={sidebarItems} />

      <div className={`transition-all duration-200 ${open ? 'pl-64' : 'pl-16'}`}>
        <Navbar onMenuClick={() => setOpen((o) => !o)}>{navbarActions}</Navbar>

        <div className={`mx-auto ${maxWidth} px-4 py-8`}>
          {title && <h1 className="mb-6 text-xl font-semibold text-text">{title}</h1>}
          {children}
        </div>
      </div>
    </div>
  );
}
