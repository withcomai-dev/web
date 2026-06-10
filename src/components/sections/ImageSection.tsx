import Link from "next/link";
import type { ImageBlockData } from "@/types/cms";

export default function ImageSection({ data }: { data: ImageBlockData }) {
  const img = (
    <figure className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      <img
        src={data.src}
        alt={data.alt}
        className="w-full rounded-2xl shadow-lg"
        loading="lazy"
      />
      {data.caption && (
        <figcaption className="mt-3 text-center text-sm text-gray-500">
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
  return (
    <section className="py-12 sm:py-16 bg-white">
      {data.href ? (
        <Link href={data.href} className="block">
          {img}
        </Link>
      ) : (
        img
      )}
    </section>
  );
}
