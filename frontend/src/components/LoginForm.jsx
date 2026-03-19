import { useState } from "react";
import axios from "axios";
import InputField from "./InputField";
import Button from "./Button";
import { useNavigate, Link } from "react-router-dom";

const LoginForm = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    let newErrors = {};

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    try {
      setLoading(true);

      const res = await axios.post("/api/auth/login", {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/dashboard");
    } catch (err) {
      setApiError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputField
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) =>
          setForm({ ...form, email: e.target.value })
        }
        error={errors.email}
        placeholder="Enter your email"
      />

      <InputField
        label="Password"
        type="password"
        value={form.password}
        onChange={(e) =>
          setForm({ ...form, password: e.target.value })
        }
        error={errors.password}
        placeholder="Enter your password"
      />

      <div className="flex justify-between items-center mb-4 text-sm text-gray-400">
        <label>
          <input
            type="checkbox"
            checked={form.remember}
            onChange={(e) =>
              setForm({ ...form, remember: e.target.checked })
            }
            className="mr-2"
          />
          Remember me
        </label>

        <a href="#" className="hover:text-blue-500">
          Forgot Password?
        </a>
      </div>

      {apiError && (
        <p className="text-red-500 mb-3">{apiError}</p>
      )}

      <Button type="submit" loading={loading} disabled={loading}>
        Login
      </Button>

      {/* Google Button (UI only) */}
      <button
        type="button"
        className="w-full mt-3 p-3 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition"
      >
        Continue with Google
      </button>

      <div className="mt-4 text-center text-gray-400">
        Don't have an account? <Link to="/register" className="text-blue-500 hover:underline">Register here</Link>
      </div>
    </form>
  );
};

export default LoginForm;