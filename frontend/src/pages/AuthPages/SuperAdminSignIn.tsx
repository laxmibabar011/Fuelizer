import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SuperAdminSignInForm from "../../components/auth/SuperAdminSignInForm";

export default function SuperAdminSignIn() {
  return (
    <>
      <PageMeta
        title="Super Admin Login | FUELIZER"
        description="Super Admin login for FUELIZER platform"
      />
      <AuthLayout>
        <SuperAdminSignInForm />
      </AuthLayout>
    </>
  );
} 