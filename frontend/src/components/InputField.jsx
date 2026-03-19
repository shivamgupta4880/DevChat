import { useState } from "react";

const InputField = ({
  label,
  type,
  value,
  onChange,
  error,
  placeholder,
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-1">{label}</label>

      <div className="relative">
        <input
          type={type === "password" && show ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-3 text-sm text-gray-400"
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default InputField;