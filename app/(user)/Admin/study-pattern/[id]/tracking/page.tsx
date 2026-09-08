import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TrackingSelector from "./tracking-selector";
export default async function TrackingPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const pattern = await prisma.pattern.findUnique({ where: { id }, select: { id: true, name: true, trackingStatus: true } }); if (!pattern) notFound(); return <TrackingSelector pattern={pattern} />; }
