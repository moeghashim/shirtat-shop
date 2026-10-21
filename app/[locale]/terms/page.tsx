import { LegalPageView, legalMetadata } from "@/components/legal/legal-page";

export const generateMetadata = () => legalMetadata("terms");

export default function LegalRoute() {
  return <LegalPageView slug="terms" />;
}
