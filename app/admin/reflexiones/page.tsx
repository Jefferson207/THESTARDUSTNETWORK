import type { Metadata } from "next";
import { AdminPostForm } from "@/components/AdminPostForm";
import "../../admin.css";

export const metadata: Metadata = { title: "Panel de artículos", robots: { index: false, follow: false } };
export default function AdminReflectionsPage() { return <AdminPostForm/>; }
