import { useState } from "react";
import axios from "axios";
import InputField from "./InputField";
import Button from "./Button";
import { useNavigate, Link } from "react-router-dom";

const RegisterForm = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    let newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email format";
    if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await axios.post("/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      setApiError(err.response?.data?.msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputField
        label="Name" type="text" value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        error={errors.name} placeholder="Enter your name"
      />
      <InputField
        label="Email" type="email" value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        error={errors.email} placeholder="Enter your email"
      />
      <InputField
        label="Password" type="password" value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        error={errors.password} placeholder="Enter your password"
      />
      {apiError && <p className="text-red-500 mb-3">{apiError}</p>}
      <Button type="submit" loading={loading} disabled={loading}>Register</Button>
      <div className="mt-4 text-center text-gray-400">
        Already have an account? <Link to="/" className="text-blue-500 hover:underline">Login here</Link>
      </div>
    </form>
  );
};

export default RegisterForm;
