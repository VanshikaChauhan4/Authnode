import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PictureRailGallery from "./ui/picture-rail-gallery";

/**
 * "Credential wall": AuthNode's verified credentials hung on a picture rail.
 * Hover (or tap) a frame to light it, drag to rearrange, click to lift it off
 * the wall - flip it over to see the verification record on the back.
 *
 * The prints are rendered by scripts/render-gallery-certificates.py into
 * /public/gallery. All names, IDs and hashes are sample data.
 */
export const CREDENTIAL_PRINTS = [
  {
    id: "degree",
    title: "B.Tech Degree Certificate",
    artist: "Northfield Institute",
    year: "2024",
    image: "/gallery/degree-certificate.jpg",
    aspect: 1414 / 1000,
    frame: "black",
    mat: true,
    drop: 0.04,
    tag: "AN-2024-0381",
    details: ["Credential AN-2024-0381", "SHA-256 9F3A7C21…C4B7", "Polygon PoS · Block #68,492,104", "Status: Verified"],
  },
  {
    id: "course",
    title: "Blockchain Fundamentals",
    artist: "AuthNode Academy",
    year: "2024",
    image: "/gallery/course-completion.jpg",
    aspect: 1.5,
    frame: "white",
    mat: false,
    drop: 0.12,
    tag: "AN-2024-0517",
    details: ["Credential AN-2024-0517", "SHA-256 4C91E7B2…A03D", "Polygon PoS · Block #68,501,332", "Status: Verified"],
  },
  {
    id: "pro",
    title: "Cloud Security Practitioner",
    artist: "Cloud Security Council",
    year: "2025",
    image: "/gallery/professional-certification.jpg",
    aspect: 0.75,
    frame: "oak",
    mat: true,
    drop: -0.02,
    tag: "AN-CCSP-2291",
    details: ["Credential AN-CCSP-2291", "SHA-256 7B02D9E4…11AF", "Polygon PoS · Block #68,214,880", "Valid until 2027"],
  },
  {
    id: "card",
    title: "Digital Credential Card",
    artist: "Meridian University",
    year: "2025",
    image: "/gallery/credential-card.jpg",
    aspect: 1,
    frame: "black",
    mat: true,
    drop: 0.16,
    tag: "AN-2291-7F3A",
    details: ["Credential AN-2291-7F3A", "SHA-256 9F3A…C4B7", "Polygon PoS · Block #68,602,019", "Status: Authentic"],
  },
  {
    id: "proof",
    title: "Blockchain Proof Record",
    artist: "AuthNode Network",
    year: "2026",
    image: "/gallery/blockchain-proof.jpg",
    aspect: 1.5,
    frame: "oak",
    mat: false,
    drop: 0.06,
    tag: "Block #68,492,104",
    details: ["Issued hash = presented hash", "Network: Polygon PoS", "Tx 0x7af9d21c…f0a4", "Result: Authentic credential"],
  },
  {
    id: "award",
    title: "Award of Excellence",
    artist: "Meridian University",
    year: "2025",
    image: "/gallery/award-excellence.jpg",
    aspect: 0.8,
    frame: "white",
    mat: true,
    drop: 0,
    tag: "AN-2025-1180",
    details: ["Credential AN-2025-1180", "SHA-256 D21E6A90…7C3B", "Polygon PoS · Block #68,730,447", "Gold Medal · Academic Merit"],
  },
  {
    id: "badge",
    title: "Smart Contracts · Level 3",
    artist: "AuthNode Academy",
    year: "2025",
    image: "/gallery/skill-badge.jpg",
    aspect: 1,
    frame: "black",
    mat: false,
    drop: 0.1,
    tag: "AN-BDG-4410",
    details: ["Credential AN-BDG-4410", "SHA-256 55A8F0C3…1E9D", "Verified skill badge", "Status: Verified on-chain"],
  },
  {
    id: "receipt",
    title: "Verification Receipt",
    artist: "Meridian University",
    year: "2026",
    image: "/gallery/verification-receipt.jpg",
    aspect: 0.75,
    frame: "oak",
    mat: true,
    drop: 0.03,
    tag: "AN-RCP-0091",
    details: ["Holder: Neha Verma", "M.Sc. Cyber Security", "Fingerprint matches on-chain proof", "Result: Authentic"],
  },
];

const LABELS = {
  front: "Certificate",
  back: "Proof",
  close: "Close",
  open: "Lift to inspect",
  record: "Verification record",
};

export default function CredentialWall() {
  const navigate = useNavigate();

  return (
    <section id="credential-wall" className="relative border-b border-white/[0.07]">
      <PictureRailGallery
        items={CREDENTIAL_PRINTS}
        labels={LABELS}
        eyebrow="Credential wall · Verified on-chain"
        heading="Every credential, framed with proof."
        caption="Brush along the rail to light a credential, drag to rearrange, lift one off the wall and flip it to see its proof."
        autoplay
        className="pb-2 pt-6 lg:pt-10"
        action={
          <button
            type="button"
            onClick={() => navigate("/verify")}
            className="group inline-flex items-center gap-3 rounded-full bg-violet-200 px-6 py-3 text-sm font-semibold text-[#090817] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
          >
            Verify a certificate
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        }
      />
    </section>
  );
}
