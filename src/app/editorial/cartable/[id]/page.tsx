"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Editor } from "@/components/editorial/editor";

export default function StoryPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const pitch = searchParams.get("pitch") ?? "";
  return <Editor key={`${id}:${pitch}`} id={id} />;
}
