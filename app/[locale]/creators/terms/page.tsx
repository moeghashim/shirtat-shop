import { LegalPageView, legalMetadata } from "@/components/legal/legal-page";

export const generateMetadata = () => legalMetadata("designer-terms");

export default function LegalRoute() {
  return <LegalPageView slug="designer-terms" />;
}
