import { LegalPageView, legalMetadata } from "@/components/legal/legal-page";

export const generateMetadata = () => legalMetadata("shipping");

export default function LegalRoute() {
  return <LegalPageView slug="shipping" />;
}
