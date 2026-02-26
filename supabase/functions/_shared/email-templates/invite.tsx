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
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to Growth Lab</Preview>
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
        <Heading style={h1}>You've been invited</Heading>
        <Text style={text}>
          You've been invited to join Growth Lab — strategic frameworks and tools for legal business development. Click below to accept and get started.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
        <Text style={footerBrand}>
          © {new Date().getFullYear()} Growth Lab by Beyond Billable Hours
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#f5f5f5', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }
const container = { backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px 32px', margin: '40px auto', maxWidth: '480px' }
const logo = { marginBottom: '4px' }
const brandTag = { fontSize: '12px', color: '#ECCE45', fontWeight: '500' as const, margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#2a2d32', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 28px' }
const button = { backgroundColor: '#2a2d32', color: '#fafafa', fontSize: '14px', borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', fontWeight: '600' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
const footerBrand = { fontSize: '11px', color: '#cccccc', margin: '16px 0 0' }
