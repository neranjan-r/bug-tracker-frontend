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

export default function RegisterPage() {
  usePageTitle("Create account");
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      toast.success("Account created");
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
          <h1 className="mt-4 text-lg font-semibold text-ink">Create account</h1>
          <p className="mt-0.5 text-xs text-ink-muted">
            Register to create projects or join an existing workspace.
          </p>
        </div>

        <div className="space-y-3">
          <AlertBanner message={error} />

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div>
              <FieldLabel htmlFor="register-name">Full name</FieldLabel>
              <Input
                id="register-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maya Lin"
              />
            </div>

            <div>
              <FieldLabel htmlFor="register-email">Email</FieldLabel>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>

            <div>
              <FieldLabel htmlFor="register-password">Password</FieldLabel>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </div>

        <p className="mt-5 pt-4 border-t border-line text-xs text-ink-muted">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-medium text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
