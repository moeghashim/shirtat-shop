import { LegalPageView, legalMetadata } from "@/components/legal/legal-page";

export const generateMetadata = () => legalMetadata("creator-terms");

export default function LegalRoute() {
  return <LegalPageView slug="creator-terms" />;
}
