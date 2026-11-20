
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus,
  Tag,
  Trash2,
  Pencil,
  RefreshCw,
  X,
  CalendarDays,
  Percent,
} from "lucide-react";

const initialForm = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  minimum_order: "",
  usage_limit: "",
  starts_at: "",
  expires_at: "",
  is_active: true,
};

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  async function loadPromotions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erreur de chargement : " + error.message);
    } else {
      setPromotions(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadPromotions();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function openAddForm() {
    setEditingPromotion(null);
    setFormData({ ...initialForm });
    setShowForm(true);
  }

  function openEditForm(promotion) {
    setEditingPromotion(promotion);

    setFormData({
      code: promotion.code || "",
      description: promotion.description || "",
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      minimum_order: promotion.minimum_order ?? "",
      usage_limit: promotion.usage_limit ?? "",
      starts_at: promotion.starts_at
        ? promotion.starts_at.slice(0, 16)
        : "",
      expires_at: promotion.expires_at
        ? promotion.expires_at.slice(0, 16)
        : "",
      is_active: promotion.is_active,
    });

    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingPromotion(null);
    setFormData({ ...initialForm });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const code = formData.code.trim().toUpperCase();
    const discount = Number(formData.discount_value);

    if (!/^[A-Z0-9_-]+$/.test(code)) {
      alert("Utilisez uniquement des lettres, chiffres, tirets ou underscores.");
      return;
    }

    if (!Number.isFinite(discount) || discount <= 0) {
      alert("Veuillez saisir une réduction valide.");
      return;
    }

    if (
      formData.discount_type === "percentage" &&
      discount > 100
    ) {
      alert("Une réduction en pourcentage ne peut pas dépasser 100 %.");
      return;
    }

    if (
      formData.minimum_order !== "" &&
      Number(formData.minimum_order) < 0
    ) {
      alert("Le minimum de commande doit être positif.");
      return;
    }

    if (
      formData.usage_limit !== "" &&
      (!Number.isInteger(Number(formData.usage_limit)) ||
        Number(formData.usage_limit) < 1)
    ) {
      alert("La limite d'utilisation doit être un nombre entier positif.");
      return;
    }

    if (
      formData.starts_at &&
      formData.expires_at &&
      new Date(formData.expires_at) <= new Date(formData.starts_at)
    ) {
      alert("La date d'expiration doit être après la date de début.");
      return;
    }

    setSaving(true);

    const promotionData = {
      code,
      description: formData.description.trim() || null,
      discount_type: formData.discount_type,
      discount_value: discount,
      minimum_order:
        formData.minimum_order === ""
          ? 0
          : Number(formData.minimum_order),
      usage_limit:
        formData.usage_limit === ""
          ? null
          : Number(formData.usage_limit),
      starts_at: formData.starts_at
        ? new Date(formData.starts_at).toISOString()
        : null,
      expires_at: formData.expires_at
        ? new Date(formData.expires_at).toISOString()
        : null,
      is_active: formData.is_active,
    };

    try {
      let error;

      if (editingPromotion) {
        const result = await supabase
          .from("coupons")
          .update(promotionData)
          .eq("id", editingPromotion.id);

        error = result.error;
      } else {
        const result = await supabase
          .from("coupons")
          .insert([promotionData]);

        error = result.error;
      }

      if (error) throw error;

      alert(
        editingPromotion
          ? "Code promo modifié avec succès !"
          : "Code promo créé avec succès !"
      );

      closeForm();
      await loadPromotions();
    } catch (error) {
      console.error(error);
      alert("Erreur : " + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function togglePromotion(promotion) {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !promotion.is_active })
      .eq("id", promotion.id);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    await loadPromotions();
  }

  async function deletePromotion(promotion) {
    const confirmed = window.confirm(
      `Supprimer le code promo "${promotion.code}" ?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", promotion.id);

    if (error) {
      alert("Erreur de suppression : " + error.message);
      return;
    }

    alert("Code promo supprimé.");
    await loadPromotions();
  }

  function formatDate(date) {
    if (!date) return "Aucune";

    return new Date(date).toLocaleDateString("fr-FR");
  }

  function getPromotionStatus(promotion) {
    const now = new Date();

    if (!promotion.is_active) return "Désactivé";

    if (promotion.starts_at && new Date(promotion.starts_at) > now) {
      return "À venir";
    }

    if (promotion.expires_at && new Date(promotion.expires_at) < now) {
      return "Expiré";
    }

    if (
      promotion.usage_limit !== null &&
      promotion.used_count >= promotion.usage_limit
    ) {
      return "Limite atteinte";
    }

    return "Actif";
  }

  return (
    <div className="promotions-admin">
      <div className="promotions-header">
        <div>
          <h1>Gestion des promotions</h1>
          <p>Créez et gérez les codes promo de PARAÉLLE.</p>
        </div>

        <button className="add-promotion-button" onClick={openAddForm}>
          <Plus size={18} />
          Créer un code promo
        </button>
      </div>

      <div className="promotion-summary">
        <div>
          <Tag size={22} />
          <span>Total des codes promo</span>
          <strong>{promotions.length}</strong>
        </div>

        <div>
          <Percent size={22} />
          <span>Codes actifs</span>
          <strong>
            {promotions.filter(
              (promotion) => getPromotionStatus(promotion) === "Actif"
            ).length}
          </strong>
        </div>
      </div>

      <div className="promotions-toolbar">
        <h2>Vos codes promo</h2>

        <button
          className="refresh-button"
          onClick={loadPromotions}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Actualiser
        </button>
      </div>

      <div className="promotions-table-container">
        {loading ? (
          <p className="products-message">Chargement...</p>
        ) : promotions.length === 0 ? (
          <div className="promotions-empty">
            <Tag size={38} />
            <h3>Aucun code promo</h3>
            <p>Créez votre première promotion pour votre boutique.</p>
          </div>
        ) : (
          <table className="promotions-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Réduction</th>
                <th>Minimum</th>
                <th>Utilisations</th>
                <th>Expiration</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {promotions.map((promotion) => (
                <tr key={promotion.id}>
                  <td>
                    <strong className="promotion-code">
                      {promotion.code}
                    </strong>
                    <small>{promotion.description}</small>
                  </td>

                  <td>
                    {promotion.discount_type === "percentage"
                      ? `${promotion.discount_value}%`
                      : `${promotion.discount_value} DT`}
                  </td>

                  <td>{promotion.minimum_order || 0} DT</td>

                  <td>
                    {promotion.used_count || 0} /{" "}
                    {promotion.usage_limit ?? "∞"}
                  </td>

                  <td>{formatDate(promotion.expires_at)}</td>

                  <td>
                    <span
                      className={`promotion-status ${getPromotionStatus(
                        promotion
                      )
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
                    >
                      {getPromotionStatus(promotion)}
                    </span>
                  </td>

                  <td>
                    <div className="product-actions">
                      <button
                        type="button"
                        title="Modifier"
                        onClick={() => openEditForm(promotion)}
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        title={
                          promotion.is_active ? "Désactiver" : "Activer"
                        }
                        onClick={() => togglePromotion(promotion)}
                      >
                        {promotion.is_active ? "⏸" : "▶"}
                      </button>

                      <button
                        type="button"
                        title="Supprimer"
                        onClick={() => deletePromotion(promotion)}
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

      {showForm && (
        <div className="product-form-overlay">
          <div className="product-form-modal">
            <div className="product-form-header">
              <div>
                <h2>
                  {editingPromotion
                    ? "Modifier le code promo"
                    : "Créer un code promo"}
                </h2>
                <p>Configurez votre offre promotionnelle.</p>
              </div>

              <button type="button" onClick={closeForm} disabled={saving}>
                <X size={22} />
              </button>
            </div>

            <form className="product-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Code promo *</label>
                <input
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Ex : BIENVENUE10"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Ex : Offre de bienvenue"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type de réduction *</label>
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleChange}
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (DT)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Valeur de réduction *</label>
                  <input
                    type="number"
                    name="discount_value"
                    min="0.001"
                    step="0.001"
                    value={formData.discount_value}
                    onChange={handleChange}
                    placeholder="10"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum de commande (DT)</label>
                  <input
                    type="number"
                    name="minimum_order"
                    min="0"
                    step="0.001"
                    value={formData.minimum_order}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Limite d'utilisations</label>
                  <input
                    type="number"
                    name="usage_limit"
                    min="1"
                    step="1"
                    value={formData.usage_limit}
                    onChange={handleChange}
                    placeholder="Illimitée"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date de début</label>
                  <input
                    type="datetime-local"
                    name="starts_at"
                    value={formData.starts_at}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Date d'expiration</label>
                  <input
                    type="datetime-local"
                    name="expires_at"
                    value={formData.expires_at}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  Code promo actif
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
                    : editingPromotion
                      ? "Enregistrer les modifications"
                      : "Créer le code promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
