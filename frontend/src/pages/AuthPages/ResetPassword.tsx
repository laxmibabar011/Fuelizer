import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Switch from "../../components/form/switch/Switch";
import AuthService from "../../services/authService";

export default function ResetPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [clientId, setClientId] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      // Validate clientId for tenant users
      if (!isSuperAdmin && !clientId.trim()) {
        setError("Client ID is required for tenant users");
        setLoading(false);
        return;
      }

      const res = await AuthService.forgotPassword(
        email,
        isSuperAdmin ? undefined : clientId
      );
      if (res.data.success) {
        setSuccess("OTP sent to your email.");
        setStep(2);
      } else {
        setError(res.data.message || "Failed to send OTP");
      }
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message || "Failed to send OTP";

        if (status === 404) {
          setError(
            isSuperAdmin ? "Super admin not found" : "User or client not found"
          );
        } else {
          setError(message);
        }
      } else {
        setError("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP (proceed to password entry)
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    setStep(3);
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await AuthService.resetPassword(
        email,
        otp,
        newPassword,
        confirmPassword,
        isSuperAdmin ? undefined : clientId
      );
      if (res.data.success) {
        setSuccess("Password reset successful! Redirecting to sign in...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(res.data.message || "Failed to reset password");
      }
    } catch (err: any) {
      if (err.response) {
        const message =
          err.response.data?.message || "Failed to reset password";
        setError(message);
      } else {
        setError("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800 dark:text-white">
          Reset Password
        </h2>

        {/* User Type Toggle - only show in step 1 */}
        {step === 1 && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {isSuperAdmin ? "Super Admin Reset" : "Tenant User Reset"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isSuperAdmin
                    ? "Reset password for system administrator"
                    : "Reset password for organization member"}
                </p>
              </div>
              <Switch
                label=""
                defaultChecked={isSuperAdmin}
                onChange={(checked) => {
                  setIsSuperAdmin(checked);
                  setError("");
                  if (checked) {
                    setClientId("");
                  }
                }}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            {/* Client ID field - only for tenant users */}
            {!isSuperAdmin && (
              <div>
                <Label>
                  Client ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Enter your organization's client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Contact your administrator if you don't have a client ID
                </p>
              </div>
            )}

            <div>
              <Label>
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/10 p-3 rounded-md border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-600 text-sm bg-green-50 dark:bg-green-900/10 p-3 rounded-md border border-green-200 dark:border-green-800">
                {success}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email || (!isSuperAdmin && !clientId)}
            >
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                OTP sent to <strong>{email}</strong>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isSuperAdmin ? "Super Admin" : "Tenant User"} password reset
              </p>
            </div>

            <div>
              <Label>
                OTP <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/10 p-3 rounded-md border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-600 text-sm bg-green-50 dark:bg-green-900/10 p-3 rounded-md border border-green-200 dark:border-green-800">
                {success}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!otp || otp.length !== 6}
            >
              Verify OTP
            </Button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create new password for <strong>{email}</strong>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isSuperAdmin ? "Super Admin" : "Tenant User"} account
              </p>
            </div>

            <div>
              <Label>
                New Password <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <Label>
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/10 p-3 rounded-md border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-600 text-sm bg-green-50 dark:bg-green-900/10 p-3 rounded-md border border-green-200 dark:border-green-800">
                {success}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
