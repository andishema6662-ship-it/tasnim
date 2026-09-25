"use client";

import { useParams } from "next/navigation";
import { Editor } from "@/components/editorial/editor";

export default function StoryPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <Editor key={id} id={id} />;
}
