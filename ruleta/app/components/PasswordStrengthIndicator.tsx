import type React from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  // Calculate password strength based on criteria
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);

  const criteriaMet = [hasMinLength, hasNumber, hasLetter].filter(Boolean).length;

  // Determine strength level
  let strength: "weak" | "medium" | "strong" = "weak";
  let strengthColor = "bg-red-500";
  let strengthText = "Weak";
  let strengthWidth = "33%";

  if (criteriaMet === 2) {
    strength = "medium";
    strengthColor = "bg-yellow-500";
    strengthText = "Medium";
    strengthWidth = "66%";
  } else if (criteriaMet === 3) {
    strength = "strong";
    strengthColor = "bg-green-500";
    strengthText = "Strong";
    strengthWidth = "100%";
  }

  if (password.length === 0) {
    strengthWidth = "0%";
    strengthText = "";
  }

  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strengthColor}`}
            style={{ width: strengthWidth }}
            role="progressbar"
            aria-valuenow={criteriaMet}
            aria-valuemin={0}
            aria-valuemax={3}
            aria-label={`Password strength: ${strengthText}`}
          />
        </div>
        {password.length > 0 && (
          <span className="text-sm font-semibold min-w-[60px] text-gray-300">
            {strengthText}
          </span>
        )}
      </div>

      {/* Criteria Checklist */}
      {password.length > 0 && (
        <div className="space-y-1 text-sm">
          <div className={`flex items-center gap-2 ${hasMinLength ? "text-green-400" : "text-gray-400"}`}>
            <span className="text-lg">{hasMinLength ? "✓" : "○"}</span>
            <span>At least 6 characters</span>
          </div>
          <div className={`flex items-center gap-2 ${hasNumber ? "text-green-400" : "text-gray-400"}`}>
            <span className="text-lg">{hasNumber ? "✓" : "○"}</span>
            <span>Contains a number</span>
          </div>
          <div className={`flex items-center gap-2 ${hasLetter ? "text-green-400" : "text-gray-400"}`}>
            <span className="text-lg">{hasLetter ? "✓" : "○"}</span>
            <span>Contains a letter</span>
          </div>
        </div>
      )}
    </div>
  );
}
