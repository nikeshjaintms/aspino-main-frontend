"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  User,
  FlaskConical,
  HeartHandshake,
  Stethoscope,
  TrendingUp,
  Building2,
  LockKeyhole,
} from "lucide-react";

export default function UserLoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("DOC-8092");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState("doctor");
  const [loading, setLoading] = useState(false);

  const roleConfigs = [
    {
      id: "admin",
      label: "Admin",
      icon: ShieldCheck,
      demoId: "ASP-ADMIN-01",
    },
    {
      id: "doctor",
      label: "Doctor",
      icon: Stethoscope,
      demoId: "DOC-8092",
    },
    {
      id: "sales",
      label: "Sales",
      icon: TrendingUp,
      demoId: "SALES-4021",
    },
    {
      id: "vendor",
      label: "Vendor",
      icon: Building2,
      demoId: "VEND-9910",
    },
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role.id);
    setEmployeeId(role.demoId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    if (selectedRole === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/user/dashboard");
    }
  };

  return (
    <div 
      className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-8 lg:p-12 bg-[url('/login_background.png')] bg-cover bg-center bg-no-repeat font-sans overflow-x-hidden"
    >
      {/* Main Content Area - Full Screen Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-between w-full max-w-[1400px] mx-auto gap-8 py-2 sm:py-6">
        
        {/* Left Side: Branding & Feature Highlights */}
        <div className="lg:w-[55%] flex flex-col justify-between self-stretch py-2 space-y-8 lg:space-y-12">
          
          {/* Top Brand Logo */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 shrink-0">
                <Image
                  src="/aspino-icon.png"
                  alt="Aspino Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight flex items-center leading-none">
                  <span className="text-[#1a365d]">Aspino</span>
                  <span className="text-[#00a896] ml-2">Pharma</span>
                </h1>
                <p className="text-slate-600 font-semibold text-xs sm:text-sm tracking-wide mt-1.5">
                  Caring for Life. Committed to Health.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Left Feature Badges */}
          <div className="mt-auto pt-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl">
              {/* Badge 1 */}
              <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-md">
                <div className="w-10 h-10 rounded-full border border-teal-500/40 bg-teal-50 text-[#00a896] flex items-center justify-center shrink-0 shadow-xs">
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
                <div className="w-10 h-10 rounded-full border border-teal-500/40 bg-teal-50 text-[#00a896] flex items-center justify-center shrink-0 shadow-xs">
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
                <div className="w-10 h-10 rounded-full border border-teal-500/40 bg-teal-50 text-[#00a896] flex items-center justify-center shrink-0 shadow-xs">
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
          <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl shadow-slate-900/10 space-y-6">
            
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#1e40af] to-[#0284c7] text-white flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0 p-3">
                <Shield className="h-7 w-7 text-white fill-white/20" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                  Secure Healthcare Access
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Your security is our priority
                </p>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Employee ID */}
              <div className="space-y-1.5">
                <Label htmlFor="employeeId" className="text-xs sm:text-sm font-bold text-slate-700">
                  Employee ID
                </Label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="employeeId"
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter your Employee ID"
                    className="pl-10 h-11 rounded-xl bg-slate-50/70 border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
                    required
                  />
                </div>
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-11 rounded-xl bg-slate-50/70 border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
                    required
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
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(val) => setRememberMe(!!val)}
                    className="rounded-md border-slate-300 data-[state=checked]:bg-[#00a896] data-[state=checked]:border-[#00a896]"
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-xs font-semibold text-slate-600 cursor-pointer select-none"
                  >
                    Remember Me
                  </Label>
                </div>

                <Link
                  href="#"
                  className="text-xs font-bold text-[#0284c7] hover:text-sky-700 hover:underline transition-all"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-[#009a96] via-[#0284c7] to-[#1e40af] text-white font-bold text-sm sm:text-base shadow-lg shadow-sky-600/20 hover:shadow-sky-600/35 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LockKeyhole className="h-4 w-4" />
                    <span>Secure Login</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Login As Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200/80 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
                Login as
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

            {/* Encryption Badge */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium pt-1">
              <Shield className="h-3.5 w-3.5 text-slate-400" />
              <span>Your information is encrypted and secure</span>
            </div>

          </div>
        </div>

      </div>

      {/* Full Width Footer across bottom of full screen */}
      <div className="w-full max-w-[1400px] mx-auto text-xs text-slate-500 font-medium pt-4 pb-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2024 Aspino Pharma. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link href="#" className="hover:text-slate-700 transition-colors">Privacy Policy</Link>
          <span>|</span>
          <Link href="#" className="hover:text-slate-700 transition-colors">Terms of Use</Link>
        </div>
      </div>

    </div>
  );
}
