import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import Logo from "../components/Logo";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        name,
        email,
        password,
        workspace_name: workspaceName || `${name}'s Workspace`,
      });
      navigate("/workspace");
    } catch (err) {
      setErrorMessage(err.message || "Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080C11] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Main container */}
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 lg:px-10">
        <div className="grid w-full gap-16 lg:grid-cols-2 lg:items-center">
          {/* LEFT SIDE */}
          <div className="hidden lg:block">
            <Logo />

            <div className="mt-16 max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#26313D] bg-[#10161D] px-3 py-1.5 text-xs text-gray-400">
                <UserPlus size={13} />
                Create your workspace
              </div>

              <h1 className="text-5xl font-semibold leading-tight tracking-[-0.04em]">
                Start building
                <br />
                <span className="text-gray-500">with CODEFREAK's.</span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-gray-400">
                Create your account with SQL credential security and access your
                private AI workspace with local conversation memory.
              </p>

              {/* Signup benefits */}
              <div className="mt-10 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#111820]">
                    <ShieldCheck size={18} className="text-gray-300" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      Private SQL Credentials
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      User authentication is stored locally in an encrypted SQL database.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#111820]">
                    <span className="text-sm font-semibold text-gray-300">
                      DB
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      Persistent Chat Memory
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      All your chats, thinking traces, and metadata are persisted in SQLite and loaded into your sidebar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 flex justify-center lg:hidden">
              <Logo />
            </div>

            <div className="rounded-2xl border border-[#202934] bg-[#0E141A]/90 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="mb-8">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                  Get started
                </p>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Create your account
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Set up your CODEFREAK's workspace credentials.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                  <AlertCircle size={15} className="shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full rounded-xl border border-[#202934] bg-[#111820] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />
                </div>

                {/* Workspace */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Workspace name (optional)
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="e.g. My AI Workspace"
                    className="w-full rounded-xl border border-[#202934] bg-[#111820] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />
                </div>

                {/* Email */}
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

                {/* Password */}
                <div className="relative">
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Password (min 6 characters)
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    className="w-full rounded-xl border border-[#202934] bg-[#111820] px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[37px] rounded-md p-1.5 text-gray-500 transition hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    "Create workspace"
                  )}
                </Button>
              </form>

              {/* Login link */}
              <p className="mt-7 text-center text-sm text-gray-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="font-medium text-white hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-600">
              <ShieldCheck size={13} />
              Private SQL Database · Secure PBKDF2 hashing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;