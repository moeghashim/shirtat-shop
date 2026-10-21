import { LegalPageView, legalMetadata } from "@/components/legal/legal-page";

export const generateMetadata = () => legalMetadata("contact");

export default function LegalRoute() {
  return <LegalPageView slug="contact" />;
}
