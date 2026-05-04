import type { RichTextData } from "@/types/cms";

export default function RichTextSection({ data }: { data: RichTextData }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: data.html }}
        />
      </div>
    </section>
  );
}
