'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icons } from '@/components/ui/icons'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        setError(error.message || 'Failed to sign in')
        return
      }

      console.log('✅ Login successful!', data);
      
      // Store mock session in cookie for middleware
      if (process.env.NODE_ENV === 'development' && data.session) {
        document.cookie = `mock-session=${JSON.stringify(data.session)}; path=/`;
      }
      
      // Redirect to dashboard or intended page
      router.push(redirectTo)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to sign in
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign in
              </Button>
              
              <div className="text-center text-sm">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-muted-foreground hover:text-primary"
                >
                  Forgot your password?
                </Link>
              </div>
              
              <div className="text-center text-sm">
                Don't have an account?{' '}
                <Link 
                  href="/signup" 
                  className="text-primary hover:underline"
                >
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="px-8 text-center text-sm text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="hover:text-brand underline underline-offset-4">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="hover:text-brand underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}