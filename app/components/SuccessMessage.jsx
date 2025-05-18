'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SuccessMessage({ email, redirectUrl }) {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(redirectUrl)
    }, 3000)

    return () => clearTimeout(timer)
  }, [router, redirectUrl])

  return (
    <section id="success">
      <p>
        We appreciate your business! A confirmation email will be sent to {email}.
        If you have any questions, please email <a href="mailto:orders@example.com">orders@example.com</a>.
      </p>
      <p>Redirecting you to appointments page...</p>
    </section>
  )
}