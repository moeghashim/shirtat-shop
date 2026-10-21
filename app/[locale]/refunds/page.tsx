import { LegalPageView, legalMetadata } from "@/components/legal/legal-page";

export const generateMetadata = () => legalMetadata("refunds");

export default function LegalRoute() {
  return <LegalPageView slug="refunds" />;
}
