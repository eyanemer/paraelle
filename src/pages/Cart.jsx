
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";

const DELIVERY_FEE = 7;

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [stockByProduct, setStockByProduct] = useState({});
  const [loadingStock, setLoadingStock] = useState(true);

  // Charger le panier et les stocks depuis Supabase
  useEffect(() => {
    async function loadCartAndStock() {
      try {
        const savedCart = JSON.parse(
          localStorage.getItem("paraelle-cart") || "[]"
        );

        setCartItems(savedCart);

        if (savedCart.length === 0) {
          setLoadingStock(false);
          return;
        }

        const productIds = savedCart.map((item) => item.id);

        const { data, error } = await supabase
          .from("products")
          .select("id, stock")
          .in("id", productIds);

        if (error) throw error;

        const stocks = {};

        data.forEach((product) => {
          stocks[product.id] = Number(product.stock);
        });

        setStockByProduct(stocks);
      } catch (error) {
        console.error("Erreur récupération du panier :", error);
      } finally {
        setLoadingStock(false);
      }
    }

    loadCartAndStock();
  }, []);

  // Enregistrer les modifications du panier
  function saveCart(updatedCart) {
    setCartItems(updatedCart);

    localStorage.setItem(
      "paraelle-cart",
      JSON.stringify(updatedCart)
    );

    window.dispatchEvent(new Event("cartUpdated"));
  }

  // Modifier la quantité
  function updateQuantity(id, amount) {
    const updatedCart = cartItems.map((item) => {
      if (item.id !== id) return item;

      const availableStock = stockByProduct[id];

      if (availableStock === undefined) {
        alert("Impossible de vérifier le stock. Réessayez.");
        return item;
      }

      const newQuantity = item.quantity + amount;

      if (newQuantity > availableStock) {
        alert(`Stock disponible : ${availableStock} unité(s).`);
        return item;
      }

      return {
        ...item,
        quantity: Math.max(1, newQuantity),
      };
    });

    saveCart(updatedCart);
  }

  // Supprimer un produit
  function removeItem(id) {
    const updatedCart = cartItems.filter(
      (item) => item.id !== id
    );

    saveCart(updatedCart);
  }

  // Calcul des montants
  const subtotal = cartItems.reduce(
    (total, item) =>
      total + Number(item.price) * Number(item.quantity),
    0
  );

  const deliveryFee =
    cartItems.length > 0 ? DELIVERY_FEE : 0;

  const total = subtotal + deliveryFee;

  // Panier vide
  if (cartItems.length === 0) {
    return (
      <main className="cart-page">
        <div className="cart-empty">
          <div className="cart-empty-icon">
            <ShoppingBag size={38} />
          </div>

          <h1>Votre panier est vide</h1>

          <p>
            Découvrez notre sélection de produits beauté,
            soin et bien-être.
          </p>

          <Link to="/shop" className="cart-shop-button">
            Découvrir la boutique
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="cart-container">

        {/* En-tête */}
        <div className="cart-heading">
          <div>
            <span className="cart-eyebrow">
              PARAÉLLE · VOTRE SÉLECTION
            </span>

            <h1>Mon panier</h1>

            <p>
              {cartItems.length} produit(s) dans votre panier
            </p>
          </div>

          <Link to="/shop" className="cart-back-link">
            <ArrowLeft size={17} />
            Continuer mes achats
          </Link>
        </div>

        <div className="cart-layout">

          {/* Liste des produits */}
          <section className="cart-products">
            {cartItems.map((item) => {
              const availableStock = stockByProduct[item.id];

              return (
                <article className="cart-product" key={item.id}>

                  <div className="cart-product-image">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                      />
                    ) : (
                      <ShoppingBag size={30} />
                    )}
                  </div>

                  <div className="cart-product-details">
                    <h3>{item.name}</h3>

                    <strong>
                      {Number(item.price).toFixed(2)} DT
                    </strong>

                    {/* Informations sur le stock */}
                    <span
                      className={`cart-stock ${
                        availableStock === 0 ? "out-of-stock" : ""
                      }`}
                    >
                      {loadingStock || availableStock === undefined
                        ? "Vérification du stock..."
                        : availableStock > 0
                          ? `Stock disponible : ${availableStock} unité(s)`
                          : "Stock épuisé"}
                    </span>

                    {/* Quantité et suppression */}
                    <div className="cart-product-actions">

                      <div className="cart-quantity">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, -1)
                          }
                          disabled={item.quantity <= 1}
                          aria-label="Diminuer la quantité"
                        >
                          <Minus size={14} />
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() =>
                            updateQuantity(item.id, 1)
                          }
                          disabled={
                            loadingStock ||
                            availableStock === undefined ||
                            availableStock <= 0 ||
                            item.quantity >= availableStock
                          }
                          aria-label="Augmenter la quantité"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        className="cart-remove"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 size={15} />
                        Supprimer
                      </button>

                    </div>
                  </div>

                  {/* Total par produit */}
                  <div className="cart-product-total">
                    {(
                      Number(item.price) *
                      Number(item.quantity)
                    ).toFixed(2)} DT
                  </div>

                </article>
              );
            })}
          </section>

          {/* Résumé de la commande */}
          <aside className="cart-summary">
            <h2>Résumé de la commande</h2>

            <div className="cart-summary-row">
              <span>Sous-total</span>
              <strong>{subtotal.toFixed(2)} DT</strong>
            </div>

            <div className="cart-summary-row">
              <span>Livraison</span>
              <strong>{deliveryFee.toFixed(2)} DT</strong>
            </div>

            <div className="cart-summary-total">
              <span>Total à payer</span>
              <strong>{total.toFixed(2)} DT</strong>
            </div>

            <p className="cart-payment-info">
              Paiement en espèces à la livraison.
            </p>

            <Link
              to="/checkout"
              className="cart-checkout-button"
            >
              Passer la commande
              <ArrowRight size={18} />
            </Link>

            <div className="cart-secure-info">
              <ShoppingCart size={16} />
              Commande simple et sécurisée
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
