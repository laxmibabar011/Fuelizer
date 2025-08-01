import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Login | FUELIZER"
        description="Login to your FUELIZER organization"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
