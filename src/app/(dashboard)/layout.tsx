import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DashboardSidebar } from "./dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profiles matching user.id
  const { data: profile } = await supabase
    .from("kleiner_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const userInitial = (profile?.nombre?.[0] || user.email?.[0] || "U").toUpperCase();
  const fullName = profile ? `${profile.nombre} ${profile.apellido}` : (user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario");

  // Sign out server action
  async function handleSignOut() {
    "use server";
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Responsive Sidebar Section */}
          <div className="lg:col-span-3 w-full">
            <DashboardSidebar 
              userInitial={userInitial}
              fullName={fullName}
              email={user.email || ""}
              onSignOut={handleSignOut}
            />
          </div>

          {/* Main Dashboard Panel */}
          <div className="lg:col-span-9 w-full">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
