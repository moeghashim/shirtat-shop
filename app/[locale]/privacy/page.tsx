import { LegalPageView, legalMetadata } from "@/components/legal/legal-page";

export const generateMetadata = () => legalMetadata("privacy");

export default function LegalRoute() {
  return <LegalPageView slug="privacy" />;
}
