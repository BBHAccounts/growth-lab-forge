import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { BookEmailLayout, emailStyles } from './book-email-layout.tsx'
interface Props { siteName?: string; siteUrl?: string; recipient?: string; confirmationUrl?: string; token?: string }
export const MagicLinkEmail = ({ token = '' }: Props) => <BookEmailLayout title="Your sign-in code" preview="Your Beyond the Book sign-in code"><Text style={emailStyles.text}>Enter this code on the sign-in page to continue to Beyond the Book.</Text><Text style={emailStyles.code}>{token}</Text><Text style={emailStyles.text}>Use the most recent code. If you did not request it, you can ignore this email.</Text></BookEmailLayout>
export default MagicLinkEmail
