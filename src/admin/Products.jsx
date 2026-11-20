
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  RefreshCw,
  X,
  Upload,
} from "lucide-react";

const initialFormData = {
  name: "",
  description: "",
  price: "",
  compare_at_price: "",
  stock: "",
  category_id: "",
  brand_id: "",
  is_active: true,
  is_featured: false,
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  // Produit en cours de modification
  const [editingProduct, setEditingProduct] = useState(null);

  function generateSlug(name) {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }


async function deleteProductImage(imageUrl) {
  if (!imageUrl) return;

  try {
    const marker = "/storage/v1/object/public/product-images/";
    const imagePath = imageUrl.split(marker)[1];

    if (!imagePath) return;

    const { error } = await supabase.storage
      .from("product-images")
      .remove([decodeURIComponent(imagePath)]);

    if (error) {
      console.error("Erreur suppression image :", error);
    }
  } catch (error) {
    console.error("Erreur image :", error);
  }
}


  async function loadProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur produits :", error);
      alert("Impossible de charger les produits : " + error.message);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  async function loadFormOptions() {
    const [categoriesResult, brandsResult] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),

      supabase
        .from("brands")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
    ]);

    if (categoriesResult.error || brandsResult.error) {
      console.error(categoriesResult.error || brandsResult.error);
      alert("Impossible de charger les catégories et les marques.");
      return;
    }

    setCategories(categoriesResult.data || []);
    setBrands(brandsResult.data || []);
  }

  useEffect(() => {
    loadProducts();
    loadFormOptions();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // Ouvrir le formulaire d'ajout
  function openAddForm() {
    setEditingProduct(null);
    setFormData({ ...initialFormData });
    setImageFile(null);
    setShowForm(true);
  }

  // Ouvrir le formulaire de modification
  function openEditForm(product) {
    setEditingProduct(product);

    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      compare_at_price: product.compare_at_price ?? "",
      stock: product.stock ?? "",
      category_id: product.category_id || "",
      brand_id: product.brand_id || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
    });

    setImageFile(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setImageFile(null);
    setEditingProduct(null);
    setFormData({ ...initialFormData });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Veuillez saisir le nom du produit.");
      return;
    }

    if (formData.price === "" || Number(formData.price) < 0) {
      alert("Veuillez saisir un prix valide.");
      return;
    }

    if (
      formData.compare_at_price !== "" &&
      Number(formData.compare_at_price) < 0
    ) {
      alert("Veuillez saisir un ancien prix valide.");
      return;
    }

    if (formData.stock === "" || Number(formData.stock) < 0) {
      alert("Veuillez saisir une quantité en stock valide.");
      return;
    }

    if (imageFile) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(imageFile.type)) {
        alert("Format accepté : JPG, PNG ou WebP.");
        return;
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        alert("L'image ne doit pas dépasser 5 Mo.");
        return;
      }
    }

    setSaving(true);

    let uploadedImagePath = null;

    try {
      // Conserver l'ancienne image pendant une modification
      let imageUrl = editingProduct
        ? editingProduct.image_url
        : null;

      // Télécharger une nouvelle image si elle a été sélectionnée
      if (imageFile) {
        const extension = imageFile.name
          .split(".")
          .pop()
          .toLowerCase();

        const fileName = `${crypto.randomUUID()}.${extension}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        uploadedImagePath = filePath;

        const { data: imageData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        imageUrl = imageData.publicUrl;
      }

      // Conserver le slug actuel si le nom n'a pas changé
      const slug =
        editingProduct &&
        formData.name.trim() === editingProduct.name
          ? editingProduct.slug
          : `${generateSlug(formData.name)}-${crypto.randomUUID().slice(0, 8)}`;

      const productData = {
        name: formData.name.trim(),
        slug,
        description: formData.description.trim() || null,
        price: Number(formData.price),
        compare_at_price:
          formData.compare_at_price === ""
            ? null
            : Number(formData.compare_at_price),
        stock: Number(formData.stock),
        category_id: formData.category_id || null,
        brand_id: formData.brand_id || null,
        image_url: imageUrl,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        updated_at: new Date().toISOString(),
      };

      let saveError;

      if (editingProduct) {
        // Modifier le produit existant
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        saveError = error;
      } else {
        // Ajouter un nouveau produit
        const { error } = await supabase
          .from("products")
          .insert([productData]);

        saveError = error;
      }

      if (saveError) {
        throw saveError;
      }
      // Supprimer l'ancienne image après une modification réussie
if (
  editingProduct &&
  imageFile &&
  editingProduct.image_url &&
  editingProduct.image_url !== imageUrl
) {
  await deleteProductImage(editingProduct.image_url);
}

      alert(
        editingProduct
          ? "Produit modifié avec succès !"
          : "Produit ajouté avec succès !"
      );

      closeForm();
      await loadProducts();
    } catch (error) {
      console.error("Erreur enregistrement produit :", error);

      // Supprimer la nouvelle image si l'enregistrement échoue
      if (uploadedImagePath) {
        const { error: deleteError } = await supabase.storage
          .from("product-images")
          .remove([uploadedImagePath]);

        if (deleteError) {
          console.error(
            "Erreur suppression image temporaire :",
            deleteError
          );
        }
      }

      alert("Erreur : " + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer "${product.name}" ?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      alert("Erreur de suppression : " + error.message);
      return;
    }
    // Supprimer l'image associée au produit
if (product.image_url) {
  await deleteProductImage(product.image_url);
}
    alert("Produit supprimé avec succès.");
    await loadProducts();
  }

  return (
    <div className="products-admin">
      <div className="products-admin-header">
        <div>
          <h1>Gestion des produits</h1>
          <p>Gérez le catalogue de votre boutique PARAÉLLE.</p>
        </div>

        <button
          className="add-product-button"
          onClick={openAddForm}
        >
          <Plus size={18} />
          Ajouter un produit
        </button>
      </div>

      <div className="products-toolbar">
        <div className="products-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={loadProducts}
          className="refresh-button"
          disabled={loading}
        >
          <RefreshCw size={17} />
          Actualiser
        </button>
      </div>

      <div className="products-table-container">
        {loading ? (
          <p className="products-message">
            Chargement des produits...
          </p>
        ) : filteredProducts.length === 0 ? (
          <p className="products-message">
            Aucun produit trouvé.
          </p>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-product-info">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                        />
                      ) : (
                        <div className="admin-product-placeholder">
                          <Package size={20} />
                        </div>
                      )}

                      <strong>{product.name}</strong>
                    </div>
                  </td>

                  <td>{product.price} DT</td>
                  <td>{product.stock}</td>

                  <td>
                    <span
                      className={
                        product.is_active
                          ? "product-status active"
                          : "product-status inactive"
                      }
                    >
                      {product.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>

                  <td>
                    <div className="product-actions">
                      <button
                        type="button"
                        aria-label="Modifier"
                        title="Modifier le produit"
                        onClick={() => openEditForm(product)}
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        aria-label="Supprimer"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="products-count">
        {products.length} produit(s) enregistré(s)
      </p>

      {showForm && (
        <div className="product-form-overlay">
          <div className="product-form-modal">
            <div className="product-form-header">
              <div>
                <h2>
                  {editingProduct
                    ? "Modifier le produit"
                    : "Ajouter un produit"}
                </h2>

                <p>
                  {editingProduct
                    ? "Modifiez les informations du produit."
                    : "Complétez les informations du produit."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Fermer"
                disabled={saving}
              >
                <X size={22} />
              </button>
            </div>

            <form className="product-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom du produit *</label>

                <input
                  type="text"
                  name="name"
                  placeholder="Ex : Crème Hydratante"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  name="description"
                  placeholder="Description du produit..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Prix de vente (DT) *</label>

                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.001"
                    placeholder="45"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ancien prix (DT)</label>

                  <input
                    type="number"
                    name="compare_at_price"
                    min="0"
                    step="0.001"
                    placeholder="55"
                    value={formData.compare_at_price}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Quantité en stock *</label>

                <input
                  type="number"
                  name="stock"
                  min="0"
                  step="1"
                  placeholder="20"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Catégorie</label>

                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                  >
                    <option value="">Choisir une catégorie</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Marque</label>

                  <select
                    name="brand_id"
                    value={formData.brand_id}
                    onChange={handleChange}
                  >
                    <option value="">Choisir une marque</option>

                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Image du produit</label>

                {editingProduct?.image_url && !imageFile && (
                  <div className="current-product-image">
                    <img
                      src={editingProduct.image_url}
                      alt={editingProduct.name}
                    />
                    <span>Image actuelle</span>
                  </div>
                )}

                <label className="image-upload-area">
                  <Upload size={24} />

                  <span>
                    {imageFile
                      ? imageFile.name
                      : "Cliquez pour choisir une image"}
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(e) =>
                      setImageFile(e.target.files?.[0] || null)
                    }
                  />
                </label>
              </div>

              <div className="form-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  Produit actif
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                  />
                  Produit à la une
                </label>
              </div>

              <div className="product-form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="save-product-button"
                  disabled={saving}
                >
                  {saving
                    ? "Enregistrement..."
                    : editingProduct
                      ? "Enregistrer les modifications"
                      : "Enregistrer le produit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
