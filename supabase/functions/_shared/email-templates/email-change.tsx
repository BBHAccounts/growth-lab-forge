import * as React from 'npm:react@18.3.1'
import { Text, Button } from 'npm:@react-email/components@0.0.22'
import { BookEmailLayout, emailStyles } from './book-email-layout.tsx'
interface Props { siteName?: string; siteUrl?: string; email?: string; oldEmail?: string; newEmail?: string; confirmationUrl: string }
export const EmailChangeEmail = ({ confirmationUrl }: Props) => <BookEmailLayout title="Confirm your email change" preview="Confirm your email change for Beyond the Book"><Text style={emailStyles.text}>Confirm the new email address for your Beyond the Book account.</Text><Button href={confirmationUrl} style={emailStyles.button}>Confirm email change</Button><Text style={{ ...emailStyles.text, fontSize: '12px', marginTop: '28px' }}>If you did not request this email, you can ignore it.</Text></BookEmailLayout>
export default EmailChangeEmail
