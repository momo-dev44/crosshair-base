import { notFound } from "next/navigation";
import { crosshairs } from "@/lib/data";
import DetailClient from "./DetailClient";

export function generateStaticParams() {
  return crosshairs.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const crosshair = crosshairs.find((c) => c.id === id);
  if (!crosshair) return {};
  return {
    title: `${crosshair.name} Crosshair — CrosshairBase`,
    description: `${crosshair.name}'s Valorant crosshair code. Copy and paste directly into Valorant settings.`,
  };
}

export default async function CrosshairPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const crosshair = crosshairs.find((c) => c.id === id);

  if (!crosshair) notFound();

  return <DetailClient crosshair={crosshair} />;
}
