import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import usePageTitle from "../utils/usePageTitle.js";
import {
  AlertBanner,
  Button,
  FieldLabel,
  Input,
  Wordmark,
} from "../components/ui.jsx";

export default function LoginPage() {
  usePageTitle("Sign in");
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success("Signed in");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4 py-8">
      <div className="w-full max-w-sm bg-surface border border-line-strong rounded-panel p-6">
        <div className="mb-5">
          <Wordmark />
          <h1 className="mt-4 text-lg font-semibold text-ink">Sign in</h1>
          <p className="mt-0.5 text-xs text-ink-muted">
            Enter your account credentials to open your projects.
          </p>
        </div>

        <div className="space-y-3">
          <AlertBanner message={error} />

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div>
              <FieldLabel htmlFor="login-email">Email</FieldLabel>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>

            <div>
              <FieldLabel htmlFor="login-password">Password</FieldLabel>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-5 pt-4 border-t border-line text-xs text-ink-muted">
          No account yet?{" "}
          <Link
            to="/register"
            className="font-medium text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
