import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import AuthService from "../../services/authService";

export default function SuperAdminSignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setAuthUser, setAccessToken } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await AuthService.superAdminLogin(email, password);

      const data = response.data;
      if (
        data.success &&
        data.data &&
        data.data.accessToken &&
        data.data.user
      ) {
        setAccessToken(data.data.accessToken);
        setAuthUser(data.data.user);

        // Redirect to super admin dashboard
        navigate("/super-admin-dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message || "Login failed";

        if (status === 400) {
          setError("Missing required fields or invalid data");
        } else if (status === 401) {
          setError("Invalid credentials");
        } else if (status === 404) {
          setError("Super admin not found");
        } else if (status === 500) {
          setError("Server error. Please try again later.");
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

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Super Admin Login
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Access system administration panel
            </p>
          </div>

          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Email field */}
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Password field */}
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Remember me and forgot password */}
                <div className="flex items-center justify-between">
                  {/* <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link> */}
                </div>

                {/* Error message */}
                {error && (
                  <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/10 p-3 rounded-md border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Log in as Super Admin"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 