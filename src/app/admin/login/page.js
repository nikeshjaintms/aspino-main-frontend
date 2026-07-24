"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ShieldCheck,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserCheck,
  FlaskConical,
  HeartHandshake,
  TrendingUp,
  Building2,
  LockKeyhole,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  X,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@aspino.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("admin@aspino.com");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Validation & Error States
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const roleConfigs = [
    {
      id: "admin",
      label: "Admin",
      icon: ShieldCheck,
      demoEmail: "admin@aspino.com",
      demoPass: "admin123",
    },
    {
      id: "user",
      label: "User",
      icon: UserCheck,
      demoEmail: "user@aspino.com",
      demoPass: "user123",
    },
    {
      id: "sales",
      label: "Sales",
      icon: TrendingUp,
      demoEmail: "sales@aspino.com",
      demoPass: "sales123",
    },
    {
      id: "vendor",
      label: "Vendor",
      icon: Building2,
      demoEmail: "vendor@aspino.com",
      demoPass: "vendor123",
    },
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role.id);
    setEmail(role.demoEmail);
    setPassword(role.demoPass);
    setEmailError("");
    setPasswordError("");
    setApiError("");
  };

  // Real-time validation
  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setApiError("");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError("Email address is required.");
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMsg("");

    if (!validateForm()) {
      return;
    }

    // Role-specific credential validation check
    if (selectedRole !== "admin") {
      setApiError(`Invalid login: You cannot use credentials under the '${selectedRole.toUpperCase()}' role selection on this Admin Portal. Please select the 'Admin' role.`);
      return;
    }

    setLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${backendUrl}/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password");
      }

      // Store Auth Token and User Details in Cookies (not localStorage)
      if (typeof window !== "undefined") {
        const token = data.access_token;
        const userObj = JSON.stringify(data.admin || data.user);

        // Save adminToken in cookie (Valid for 1 day)
        document.cookie = `adminToken=${token}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `adminUser=${encodeURIComponent(userObj)}; path=/; max-age=86400; SameSite=Lax`;

        // Clear any old localStorage entries
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
      }

      setSuccessMsg("Login successful! Redirecting to Dashboard...");

      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 800);
    } catch (err) {
      setApiError(err.message || "Unable to connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password submit handler
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotEmail.trim()) {
      setForgotError("Please enter your registered email address.");
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError("New password must be at least 6 characters long.");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("New password and confirmation password do not match.");
      return;
    }

    setForgotLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/auth/admin/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          newPassword: forgotNewPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setForgotSuccess("Password reset successfully! You can now log in.");
      setPassword(forgotNewPassword);
      setEmail(forgotEmail);

      setTimeout(() => {
        setShowForgotModal(false);
        setForgotSuccess("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
      }, 1500);
    } catch (err) {
      setForgotError(err.message || "An error occurred during password reset.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-8 lg:p-12 bg-[url('/login_background.png')] bg-cover bg-center bg-no-repeat font-sans overflow-x-hidden">
      {/* Main Content Area - Full Screen Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1400px] mx-auto gap-8 py-2 sm:py-6">
        {/* Left Side: Branding & Feature Highlights */}
        <div className="lg:w-[55%] flex flex-col justify-between self-stretch py-2 space-y-8 lg:space-y-12">
          {/* Top Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex-shrink-0">
              <Image
                src="/aspino-icon.png"
                alt="Aspino Logo"
                fill
                priority
                className="object-contain"
              />
            </div>

            {/* Divider */}
            <div className="h-20 lg:h-24 w-[2px] bg-gradient-to-b from-[#1f4aa8] via-[#3b82f6] to-[#17b3b3] rounded-full" />

            {/* Text */}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl lg:text-5xl font-extrabold leading-none tracking-tight text-[#2345A3]">
                Aspino
              </h1>
              <h2 className="mt-1 text-2xl lg:text-3xl font-semibold leading-none text-[#0ea5e9]">
                Speciality
              </h2>
              <p className="mt-2 text-sm lg:text-base font-medium text-slate-600">
                Chemicals Private Limited
              </p>
            </div>
          </div>

          {/* Bottom Left Feature Badges */}
          <div className="mt-auto pt-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl">
              {/* Badge 1 */}
              <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-md">
                <div className="w-10 h-10 rounded-full border border-teal-500/40 bg-teal-50 text-[#0ea5e9] flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight">
                    Trusted Quality
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-tight font-medium">
                    Premium medicines you can trust.
                  </p>
                </div>
              </div>

              {/* Badge 2 */}
              <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-md">
                <div className="w-10 h-10 rounded-full border border-teal-500/40 bg-teal-50 text-[#0ea5e9] flex items-center justify-center shrink-0 shadow-xs">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight">
                    Innovation
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-tight font-medium">
                    Science-driven solutions for better health.
                  </p>
                </div>
              </div>

              {/* Badge 3 */}
              <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-md">
                <div className="w-10 h-10 rounded-full border border-teal-500/40 bg-teal-50 text-[#0ea5e9] flex items-center justify-center shrink-0 shadow-xs">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight">
                    Patient First
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-tight font-medium">
                    Dedicated to improving lives every day.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Floating Card Form */}
        <div className="lg:w-[45%] flex items-center justify-center lg:justify-end w-full">
          <div className="w-full max-w-[540px] bg-white/95 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl shadow-slate-900/10 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1e40af] to-[#0284c7] text-white flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0 p-3">
                <Shield className="h-6 w-6 text-white fill-white/20" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                  Secure Admin Access
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Enter your enterprise credentials
                </p>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* API Error Notification */}
            {apiError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Success Notification */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-700 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs sm:text-sm font-bold text-slate-700">
                  Admin Email Address
                </Label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    placeholder="admin@aspino.com"
                    className={`pl-10 h-11 rounded-xl bg-slate-50/70 border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium ${
                      emailError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="text-[11px] font-semibold text-red-500 pl-1">{emailError}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs sm:text-sm font-bold text-slate-700">
                  Password
                </Label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    placeholder="••••••••"
                    className={`pl-10 pr-10 h-11 rounded-xl bg-slate-50/70 border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium ${
                      passwordError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 text-slate-400 hover:text-slate-600 h-8 w-8 rounded-lg"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordError && (
                  <p className="text-[11px] font-semibold text-red-500 pl-1">{passwordError}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(val) => setRememberMe(!!val)}
                    className="rounded-md border-slate-300 data-[state=checked]:bg-[#0ea5e9] data-[state=checked]:border-[#00a896]"
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-xs font-semibold text-slate-600 cursor-pointer select-none"
                  >
                    Remember Me
                  </Label>
                </div>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-bold text-[#0284c7] hover:text-sky-700 hover:underline transition-all cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-[#0ea5e9] via-[#0284c7] to-[#1e40af] text-white font-bold text-sm sm:text-base shadow-lg shadow-sky-600/20 hover:shadow-sky-600/35 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LockKeyhole className="h-4 w-4" />
                    <span>Secure Admin Login</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Login As Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200/80 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
                Quick Select Role
              </span>
            </div>

            {/* Role Selectors */}
            <div className="grid grid-cols-4 gap-2">
              {roleConfigs.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer gap-1.5 ${
                      isSelected
                        ? "border-[#0284c7] bg-sky-50/80 text-[#0284c7] font-bold shadow-xs ring-2 ring-sky-500/20"
                        : "border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isSelected ? "text-[#0284c7]" : "text-slate-500"}`} />
                    <span className="text-[11px] leading-none">{role.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative border border-slate-200">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Reset Password</h3>
                <p className="text-xs text-slate-500">Enter your registered email and new password</p>
              </div>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="forgotEmail" className="text-xs font-bold text-slate-700">Email Address</Label>
                <Input
                  id="forgotEmail"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@aspino.com"
                  className="h-10 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="forgotNewPassword" className="text-xs font-bold text-slate-700">New Password</Label>
                <Input
                  id="forgotNewPassword"
                  type="password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="h-10 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="forgotConfirmPassword" className="text-xs font-bold text-slate-700">Confirm New Password</Label>
                <Input
                  id="forgotConfirmPassword"
                  type="password"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-10 text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotModal(false)}
                  className="h-10 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="h-10 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4"
                >
                  {forgotLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
