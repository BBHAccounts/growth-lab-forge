/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for Growth Lab</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://pavcfkubatwuwgrtwqlr.supabase.co/storage/v1/object/public/email-assets/gl-logo-dark.svg"
          width="48"
          height="48"
          alt="Growth Lab"
          style={logo}
        />
        <Text style={brandTag}>by Beyond Billable Hours</Text>
        <Heading style={h1}>Confirm your email change</Heading>
        <Text style={text}>
          You requested to change your email from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link> to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email Change
        </Button>
        <Text style={footer}>
          If you didn't request this change, please secure your account immediately.
        </Text>
        <Text style={footerBrand}>
          © {new Date().getFullYear()} Growth Lab by Beyond Billable Hours
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#f5f5f5', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }
const container = { backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px 32px', margin: '40px auto', maxWidth: '480px' }
const logo = { marginBottom: '4px' }
const brandTag = { fontSize: '12px', color: '#ECCE45', fontWeight: '500' as const, margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#2a2d32', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 28px' }
const link = { color: 'inherit', textDecoration: 'underline' }
const button = { backgroundColor: '#2a2d32', color: '#fafafa', fontSize: '14px', borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', fontWeight: '600' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
const footerBrand = { fontSize: '11px', color: '#cccccc', margin: '16px 0 0' }
