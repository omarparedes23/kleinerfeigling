import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductDetail } from "@/components/product/product-detail";
import type { ProductWithCategory, Category } from "@/types/product";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;

  const supabase = await createServerSupabaseClient();
  
  // Fetch product matching the slug and check active status
  // Joint query includes category details
  const { data, error } = await supabase
    .from("kleiner_products")
    .select("*, categoria:kleiner_categories(*)")
    .eq("slug", slug)
    .eq("activo", true)
    .maybeSingle();

  if (error) {
    console.error("Error fetching product by slug:", error);
    notFound();
  }

  if (!data) {
    notFound();
  }

  // Cast product to include category correctly
  const product: ProductWithCategory = {
    ...data,
    categoria: data.categoria ? (data.categoria as unknown as Category) : null,
  };

  return <ProductDetail product={product} />;
}
