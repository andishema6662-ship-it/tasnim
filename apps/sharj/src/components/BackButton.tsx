import { useNavigate } from 'react-router-dom'

/** One-step back with safe fallback when history is empty (deep link / refresh). */
export function BackButton({
  fallback = '/app',
  label = 'بازگشت',
  className = 'btn-ghost',
}: {
  fallback?: string
  label?: string
  className?: string
}) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (window.history.length > 1) navigate(-1)
        else navigate(fallback)
      }}
    >
      {label}
    </button>
  )
}
