
import { supabase } from "./supabase";

export async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      description,
      price,
      compare_at_price,
      stock,
      image_url,
      is_featured,
      brands(name)
    `)
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur chargement produits :", error);
    throw error;
  }

  return data;
}
