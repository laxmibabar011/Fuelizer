import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import AuthService from "../../services/authService";

export default function ResetPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await AuthService.forgotPassword(email);
      if (res.data.success) {
        setSuccess("OTP sent to your email.");
        setStep(2);
      } else {
        setError(res.data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error");
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
      const res = await AuthService.resetPassword(email, otp, newPassword, confirmPassword);
      if (res.data.success) {
        setSuccess("Password reset successful! Redirecting to sign in...");
        setTimeout(() => navigate("/signin"), 2000);
      } else {
        setError(res.data.message || "Failed to reset password");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800 dark:text-white">Reset Password</h2>
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <Button type="submit" className="w-full" disabled={loading || !email}>
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <Label>OTP</Label>
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <Button type="submit" className="w-full" disabled={loading || !otp}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <Button type="submit" className="w-full" disabled={loading || !newPassword || !confirmPassword}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
} 