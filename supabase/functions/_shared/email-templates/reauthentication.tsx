import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { BookEmailLayout, emailStyles } from './book-email-layout.tsx'
export const ReauthenticationEmail = ({ token }: { token: string }) => <BookEmailLayout title="Confirm your identity" preview="Your Beyond the Book verification code"><Text style={emailStyles.text}>Enter this code to confirm your identity.</Text><Text style={emailStyles.code}>{token}</Text><Text style={emailStyles.text}>If you did not request this code, you can ignore this email.</Text></BookEmailLayout>
export default ReauthenticationEmail
