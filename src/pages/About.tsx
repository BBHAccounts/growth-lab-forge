import { AppLayout } from "@/components/layout/AppLayout";
import { HeroBanner } from "@/components/ui/hero-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Linkedin, Mail } from "lucide-react";

export default function About() {
  return (
    <AppLayout>
      <HeroBanner
        emoji="ℹ️"
        title="About Beyond Billable Hours"
        description="Helping legal professionals and their firms grow beyond the billable hour."
      />

      <div className="p-6 md:p-8 space-y-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Beyond Billable Hours (BBH) exists to help lawyers, marketing & BD professionals, 
              and law firms achieve sustainable growth through strategic thinking, practical tools, 
              and community learning.
            </p>
            <p>
              We believe that the best lawyers combine technical excellence with business acumen. 
              Growth Lab is our platform to make that combination accessible, interactive, and actionable.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What is Growth Lab?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Growth Lab is an interactive platform that brings together:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Strategic Models</strong> – Interactive frameworks to help you define your 
                North Star, ideal clients, and go-to-market approach
              </li>
              <li>
                <strong>Insights Hub</strong> – Curated articles, guides, and resources for 
                legal business development
              </li>
              <li>
                <strong>Research Lab</strong> – Participate in industry research and unlock premium 
                insights and benchmarks
              </li>
              <li>
                <strong>Game of Life</strong> – An immersive simulation for legal career development 
                (exclusive access)
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connect With Us</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button asChild variant="outline">
                <a
                  href="https://beyondbillablehours.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Website
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href="https://linkedin.com/company/beyond-billable-hours"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="mailto:hello@beyondbillablehours.com">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Us
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
