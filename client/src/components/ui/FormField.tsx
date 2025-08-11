import React from "react";
import { FormFieldProps } from "../../types";

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  error,
  value,
  onChange,
  defaultValue,
  disabled = false,
}) => {
  const inputClasses = `
    mt-1 block w-full px-3 py-2 border rounded-md shadow-sm 
    focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm
    ${error ? "border-red-300" : "border-gray-300"}
    ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed opacity-75" : ""}
  `;

  const renderInput = () => {
    if (type === "textarea") {
      return (
        <textarea
          id={name}
          name={name}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          defaultValue={defaultValue}
          disabled={disabled}
          rows={4}
          className={inputClasses}
        />
      );
    }

    return (
      <input
        type={type}
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        defaultValue={defaultValue}
        disabled={disabled}
        className={inputClasses}
      />
    );
  };

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className={`block text-sm font-medium ${
          disabled ? "text-gray-500" : "text-gray-700"
        }`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {renderInput()}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default FormField;
