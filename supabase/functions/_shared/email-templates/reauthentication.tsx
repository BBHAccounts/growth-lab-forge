/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for Growth Lab</Preview>
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
        <Heading style={h1}>Confirm your identity</Heading>
        <Text style={text}>Use the code below to verify it's you:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
        <Text style={footerBrand}>
          © {new Date().getFullYear()} Growth Lab by Beyond Billable Hours
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#f5f5f5', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }
const container = { backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px 32px', margin: '40px auto', maxWidth: '480px' }
const logo = { marginBottom: '4px' }
const brandTag = { fontSize: '12px', color: '#ECCE45', fontWeight: '500' as const, margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#2a2d32', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 28px' }
const codeStyle = { fontFamily: "'SF Mono', Courier, monospace", fontSize: '28px', fontWeight: 'bold' as const, color: '#2a2d32', margin: '0 0 30px', letterSpacing: '4px' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
const footerBrand = { fontSize: '11px', color: '#cccccc', margin: '16px 0 0' }
