import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, LockKeyhole, Server, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import Input from "../components/Input";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/workspace");
    } catch (err) {
      setErrorMessage(err.message || "Failed to log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080C11] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Main */}
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 lg:px-10">
        <div className="grid w-full gap-16 lg:grid-cols-2 lg:items-center">
          {/* LEFT SIDE */}
          <div className="hidden lg:block">
            <Logo />

            <div className="mt-16 max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#26313D] bg-[#10161D] px-3 py-1.5 text-xs text-gray-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Sovereign AI Workspace
              </div>

              <h1 className="text-5xl font-semibold leading-tight tracking-[-0.04em]">
                Intelligent AI.
                <br />
                <span className="text-gray-500">Under your control.</span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-gray-400">
                Build, run and manage intelligent workflows with a secure AI
                workspace designed for private and on-premise environments.
              </p>

              {/* Feature cards */}
              <div className="mt-10 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#202934] bg-[#0E141A] p-4">
                  <Server className="mb-3 h-5 w-5 text-gray-300" />
                  <p className="text-sm font-medium">On-Premise</p>
                  <p className="mt-1 text-xs text-gray-500">Your infrastructure</p>
                </div>

                <div className="rounded-xl border border-[#202934] bg-[#0E141A] p-4">
                  <ShieldCheck className="mb-3 h-5 w-5 text-gray-300" />
                  <p className="text-sm font-medium">Private</p>
                  <p className="mt-1 text-xs text-gray-500">Data stays local</p>
                </div>

                <div className="rounded-xl border border-[#202934] bg-[#0E141A] p-4">
                  <LockKeyhole className="mb-3 h-5 w-5 text-gray-300" />
                  <p className="text-sm font-medium">Secure</p>
                  <p className="mt-1 text-xs text-gray-500">SQL Credentials</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - LOGIN */}
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 flex justify-center lg:hidden">
              <Logo />
            </div>

            <div className="rounded-2xl border border-[#202934] bg-[#0E141A]/90 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="mb-8">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                  Workspace Access
                </p>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Sign in with your SQL credentials to access your workspace.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                  <AlertCircle size={15} className="shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full rounded-xl border border-[#202934] bg-[#111820] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />
                </div>

                <div className="relative">
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-[#202934] bg-[#111820] px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] rounded-md p-1.5 text-gray-500 transition hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-3.5 w-3.5 rounded border-gray-700 bg-[#111820]"
                    />
                    Remember me
                  </label>

                  <button
                    type="button"
                    className="text-xs font-medium text-gray-400 transition hover:text-white"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign in to workspace"
                  )}
                </Button>
              </form>



              <p className="mt-7 text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="font-medium text-white hover:underline"
                >
                  Create account
                </button>
              </p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-600">
              <LockKeyhole size={13} />
              Private SQL Database · Salted PBKDF2 Encryption
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;