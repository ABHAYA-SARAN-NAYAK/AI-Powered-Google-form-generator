import React from "react";
import { cn } from "../../utils/cn";

const Input = React.forwardRef(({
    className,
    type = "text",
    label,
    description,
    error,
    required = false,
    id,
    ...props
}, ref) => {
    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random()?.toString(36)?.substr(2, 9)}`;

    // Base input classes
    const baseInputClasses = "flex h-11 w-full rounded-lg border border-[#1F2937] bg-[#111827] px-3.5 py-2.5 text-sm text-white ring-offset-[#0A0F1E] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-smooth";

    // Checkbox-specific styles
    if (type === "checkbox") {
        return (
            <input
                type="checkbox"
                className={cn(
                    "h-4 w-4 rounded border border-[#1F2937] bg-[#111827] text-primary focus:ring-2 focus:ring-primary focus:ring-offset-[#0A0F1E] disabled:cursor-not-allowed disabled:opacity-50 accent-indigo-600",
                    className
                )}
                ref={ref}
                id={inputId}
                {...props}
            />
        );
    }

    // Radio button-specific styles
    if (type === "radio") {
        return (
            <input
                type="radio"
                className={cn(
                    "h-4 w-4 rounded-full border border-[#1F2937] bg-[#111827] text-primary focus:ring-2 focus:ring-primary focus:ring-offset-[#0A0F1E] disabled:cursor-not-allowed disabled:opacity-50 accent-indigo-600",
                    className
                )}
                ref={ref}
                id={inputId}
                {...props}
            />
        );
    }

    // For regular inputs with wrapper structure
    return (
        <div className="space-y-1.5">
            {label && (
                <label
                    htmlFor={inputId}
                    className={cn(
                        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block",
                        error ? "text-red-400" : "text-gray-200"
                    )}
                >
                    {label}
                    {required && <span className="text-red-400 ml-1">*</span>}
                </label>
            )}

            <input
                type={type}
                className={cn(
                    baseInputClasses,
                    error && "border-red-500 focus-visible:ring-red-500",
                    className
                )}
                ref={ref}
                id={inputId}
                {...props}
            />

            {description && !error && (
                <p className="text-xs text-gray-400 mt-1">
                    {description}
                </p>
            )}

            {error && (
                <p className="text-xs text-red-400 mt-1">
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = "Input";

export default Input;