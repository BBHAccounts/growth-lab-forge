import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

const palette = { ink: '#0B1430', navy: '#03257E', cream: '#FBF7EE', paper: '#ffffff' }
export const emailStyles = {
  text: { color: palette.navy, fontSize: '15px', lineHeight: '1.5', margin: '0 0 24px', fontFamily: 'Raleway, Arial, sans-serif' },
  button: { backgroundColor: palette.ink, color: palette.cream, borderRadius: '999px', padding: '16px 28px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none' },
  code: { color: palette.ink, backgroundColor: palette.cream, fontFamily: 'Courier, monospace', fontSize: '36px', fontWeight: '700' as const, textAlign: 'center' as const, padding: '24px', margin: '24px 0', borderRadius: '8px' },
}
// The logo is hosted as a project asset, not an old Growth Lab storage URL.
const logoUrl = 'https://growthlab.beyondbillablehours.io/__l5e/assets-v1/9739393a-4b8b-4a2b-a741-be28e13ea87b/bbh-email-logo.png'
export function BookEmailLayout({ title, preview, children }: { title: string; preview: string; children: React.ReactNode }) {
  return <Html lang="en"><Head /><Preview>{preview}</Preview><Body style={{ backgroundColor: palette.paper, fontFamily: 'Raleway, Arial, sans-serif', margin: '0' }}><Container style={{ maxWidth: '560px', margin: '32px auto' }}><Section style={{ padding: '0 32px 24px' }}><Img src={logoUrl} width="170" height="65" alt="Beyond Billable Hours" /></Section><Section style={{ backgroundColor: palette.cream, padding: '40px 32px', borderRadius: '16px' }}><Text style={{ ...emailStyles.text, fontSize: '11px', fontWeight: '700', margin: '0 0 20px' }}>BEYOND THE BOOK</Text><Heading style={{ fontFamily: 'Georgia, serif', fontWeight: '400', color: palette.navy, fontSize: '34px', lineHeight: '1.1', margin: '0 0 24px' }}>{title}</Heading>{children}</Section><Text style={{ ...emailStyles.text, fontSize: '12px', margin: '24px 32px' }}>A product of Beyond Billable Hours</Text></Container></Body></Html>
}
