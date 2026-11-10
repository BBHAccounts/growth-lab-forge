import * as React from 'npm:react@18.3.1'
import { Text, Button } from 'npm:@react-email/components@0.0.22'
import { BookEmailLayout, emailStyles } from './book-email-layout.tsx'
interface Props { siteName?: string; siteUrl?: string; email?: string; oldEmail?: string; newEmail?: string; confirmationUrl: string }
export const RecoveryEmail = ({ confirmationUrl }: Props) => <BookEmailLayout title="Reset your password" preview="Reset your password for Beyond the Book"><Text style={emailStyles.text}>You requested a new password for Beyond the Book.</Text><Button href={confirmationUrl} style={emailStyles.button}>Reset password</Button><Text style={{ ...emailStyles.text, fontSize: '12px', marginTop: '28px' }}>If you did not request this email, you can ignore it.</Text></BookEmailLayout>
export default RecoveryEmail
