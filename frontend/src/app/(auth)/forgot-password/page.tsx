// Forgot Password Page - Day 2 Morning Hour 4
// - Create forgot password form
// - Add email input with validation
// - Add submit button with loading state
// - Handle form submission
// - Show success message

import ForgotPasswordForm from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
