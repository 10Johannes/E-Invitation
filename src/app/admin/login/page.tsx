import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Wedding Admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
