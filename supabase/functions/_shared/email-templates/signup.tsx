import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { BookEmailLayout, emailStyles } from './book-email-layout.tsx'
interface Props { siteName?: string; siteUrl?: string; recipient?: string; confirmationUrl?: string; token?: string }
export const SignupEmail = ({ token = '' }: Props) => <BookEmailLayout title="Welcome to Beyond the Book" preview="Your Beyond the Book sign-in code"><Text style={emailStyles.text}>Enter this code on the sign-in page to confirm your email and create your account.</Text><Text style={emailStyles.code}>{token}</Text><Text style={emailStyles.text}>Use the most recent code. If you did not request it, you can ignore this email.</Text></BookEmailLayout>
export default SignupEmail
