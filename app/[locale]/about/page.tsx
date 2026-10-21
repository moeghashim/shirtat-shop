import { LegalPageView, legalMetadata } from "@/components/legal/legal-page";

export const generateMetadata = () => legalMetadata("about");

export default function LegalRoute() {
  return <LegalPageView slug="about" />;
}
