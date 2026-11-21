
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  LoaderCircle,
  CheckCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";

const DELIVERY_FEE = 7;

export default function Checkout() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [orderNumber, setOrderNumber] = useState(null);
const [confirmedTotal, setConfirmedTotal] = useState(0);
  const cartItems = JSON.parse(
    localStorage.getItem("paraelle-cart") || "[]"
  );

  const subtotal = cartItems.reduce(
    (total, item) =>
      total + Number(item.price) * Number(item.quantity),
    0
  );

  const total = subtotal + (cartItems.length > 0 ? DELIVERY_FEE : 0);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setErrorMessage("");

    if (cartItems.length === 0) {
      setErrorMessage("Votre panier est vide.");
      return;
    }

    if (!/^[0-9\s+()-]{8,20}$/.test(formData.phone.trim())) {
      setErrorMessage("Veuillez saisir un numéro de téléphone valide.");
      return;
    }

    setLoading(true);

    try {
      const customerName = (
        formData.first_name.trim() +
        " " +
        formData.last_name.trim()
      ).trim();

      const items = cartItems.map((item) => ({
        id: item.id,
        quantity: Number(item.quantity),
      }));

      const { data, error } = await supabase.rpc(
        "create_guest_order",
        {
          p_customer_name: customerName,
          p_customer_phone: formData.phone.trim(),
          p_customer_address: formData.address.trim(),
          p_customer_city: formData.city.trim(),
          p_customer_postal_code: formData.postal_code.trim(),
          p_notes: formData.notes.trim(),
          p_items: items,
        }
      );

      if (error) {
        throw error;
      }

      if (!data?.id || !data?.order_number) {
        throw new Error(
          "La commande a été enregistrée, mais sa confirmation est incomplète. Contactez-nous avant de recommander."
        );
      }

      // Vider le panier après confirmation
      localStorage.removeItem("paraelle-cart");
      setConfirmedTotal(Number(data.total));
      window.dispatchEvent(new Event("cartUpdated"));

      setOrderNumber(data.order_number);
    } catch (error) {
      console.error("Erreur création commande :", error);

      setErrorMessage(
        error.message ||
        "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  }

  // Confirmation de commande
  if (orderNumber !== null) {
    return (
      <main className="checkout-page">
        <div className="checkout-success">
          <div className="checkout-success-icon">
            <CheckCircle size={48} />
          </div>

          <h1>Merci pour votre commande !</h1>

          <p>
            Votre commande a bien été enregistrée.
            Notre équipe vous contactera pour confirmer
            la livraison.
          </p>

          <div className="checkout-order-number">
            <span>Numéro de commande</span>
            <strong>#{orderNumber}</strong>
          </div>

          <p className="checkout-success-payment">
  Paiement à la livraison : {confirmedTotal.toFixed(2)} DT
</p>

          <Link to="/" className="checkout-submit">
            Retour à l'accueil
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-success">
          <ShoppingBag size={42} />
          <h1>Votre panier est vide</h1>
          <p>Ajoutez des produits avant de passer commande.</p>
          <Link to="/shop" className="checkout-submit">
            Découvrir la boutique
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">

        <Link to="/cart" className="checkout-back">
          <ArrowLeft size={17} />
          Retour au panier
        </Link>

        <div className="checkout-heading">
          <span>PARAÉLLE · FINALISATION</span>
          <h1>Finaliser ma commande</h1>
          <p>
            Renseignez vos coordonnées pour recevoir
            votre commande.
          </p>
        </div>

        <div className="checkout-layout">

          <form
            className="checkout-form"
            onSubmit={handleSubmit}
          >
            <section className="checkout-section">
              <div className="checkout-section-title">
                <User size={20} />
                <h2>Informations personnelles</h2>
              </div>

              <div className="checkout-fields">
                <div className="checkout-field">
                  <label>Prénom *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Votre prénom"
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label>Nom *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Votre nom"
                    required
                  />
                </div>

                <div className="checkout-field full">
                  <label>Numéro de téléphone *</label>
                  <div className="checkout-input-icon">
                    <Phone size={17} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Ex : 20 123 456"
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="checkout-section">
              <div className="checkout-section-title">
                <MapPin size={20} />
                <h2>Adresse de livraison</h2>
              </div>

              <div className="checkout-fields">
                <div className="checkout-field full">
                  <label>Adresse complète *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Rue, numéro, quartier..."
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label>Ville *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Votre ville"
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label>Code postal</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="Code postal"
                  />
                </div>

                <div className="checkout-field full">
                  <label>Remarque (facultatif)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Instructions pour la livraison..."
                    rows="4"
                  />
                </div>
              </div>
            </section>

            <section className="checkout-section">
              <div className="checkout-section-title">
                <ShoppingBag size={20} />
                <h2>Mode de paiement</h2>
              </div>

              <div className="checkout-payment-option">
                <div>
                  <strong>Paiement à la livraison</strong>
                  <p>Réglez votre commande à sa réception.</p>
                </div>

                <span className="checkout-radio"></span>
              </div>
            </section>

            {errorMessage && (
              <div className="checkout-error">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="checkout-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} />
                  Enregistrement...
                </>
              ) : (
                <>
                  Confirmer ma commande
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <aside className="checkout-info">
            <h2>Résumé de la commande</h2>

            <div className="checkout-order-items">
              {cartItems.map((item) => (
                <div
                  className="checkout-order-item"
                  key={item.id}
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>

                  <strong>
                    {(
                      Number(item.price) *
                      Number(item.quantity)
                    ).toFixed(2)} DT
                  </strong>
                </div>
              ))}
            </div>

            <div className="checkout-order-item">
              <span>Sous-total</span>
              <strong>{subtotal.toFixed(2)} DT</strong>
            </div>

            <div className="checkout-order-item">
              <span>Livraison</span>
              <strong>{DELIVERY_FEE.toFixed(2)} DT</strong>
            </div>

            <div className="checkout-total">
              <span>Total à payer</span>
              <strong>{total.toFixed(2)} DT</strong>
            </div>

            <div className="checkout-info-payment">
              <ShoppingBag size={22} />
              <div>
                <strong>Paiement à la livraison</strong>
                <span>Aucun paiement en ligne requis</span>
              </div>
            </div>

            <Link to="/cart" className="checkout-cart-link">
              Modifier mon panier
            </Link>
          </aside>

        </div>
      </div>
    </main>
  );
}
