import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  Settings,
  LogOut,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Clientes", href: "/admin/clientes", icon: Users },
    {
      name: "Cotizaciones y Contratos",
      href: "/admin/cotizaciones",
      icon: FileText,
    },
    { name: "SOPs y Recursos", href: "/admin/sops", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col hidden md:flex">
        {/* Logo / Brand */}
        <div className="h-16 flex items-center px-6 border-b border-neutral-100">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            JS Solutions <span className="text-brand-gold">Admin</span>
          </h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-brand-gold transition-colors"
                title={item.name}
              >
                <Icon className="w-5 h-5 text-neutral-400 group-hover:text-brand-gold transition-colors" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-100 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-brand-gold transition-colors">
            <Settings className="w-5 h-5 text-neutral-400" />
            Configuración
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors">
            <LogOut className="w-5 h-5 text-rose-400" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
        {/* Top Navbar Mobile (Optional placeholder) */}
        <header className="md:hidden h-16 bg-white border-b border-neutral-200 flex items-center px-4">
          <h2 className="text-lg font-bold text-neutral-900">
            JS Solutions Admin
          </h2>
        </header>

        <div className="p-8 pb-20 w-full max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
