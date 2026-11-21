
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  Users,
  Search,
  RefreshCw,
  Eye,
  X,
  ShoppingBag,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wallet,
} from "lucide-react";

const statusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function Customers() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Charger les commandes
  async function loadCustomers() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          customer_name,
          customer_phone,
          customer_email,
          customer_address,
          customer_city,
          customer_postal_code,
          subtotal,
          total,
          status,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error("Erreur chargement clientes :", error);
      alert("Impossible de charger les clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  // Regrouper les commandes par cliente
  const customers = Object.values(
    orders.reduce((result, order) => {
      const identity = (
        order.customer_phone ||
        order.customer_email ||
        order.customer_name ||
        order.id
      ).toLowerCase().trim();

      if (!result[identity]) {
        result[identity] = {
          id: identity,
          name: order.customer_name || "Cliente",
          phone: order.customer_phone || "",
          email: order.customer_email || "",
          address: order.customer_address || "",
          city: order.customer_city || "",
          postalCode: order.customer_postal_code || "",
          orders: [],
          totalSpent: 0,
        };
      }

      const customer = result[identity];

      customer.orders.push(order);

      if (Number(order.total) > 0 && order.status !== "cancelled") {
        customer.totalSpent += Number(order.total);
      }

      if (!customer.phone && order.customer_phone) {
        customer.phone = order.customer_phone;
      }

      if (!customer.email && order.customer_email) {
        customer.email = order.customer_email;
      }

      if (!customer.address && order.customer_address) {
        customer.address = order.customer_address;
      }

      if (!customer.city && order.customer_city) {
        customer.city = order.customer_city;
      }

      if (!customer.postalCode && order.customer_postal_code) {
        customer.postalCode = order.customer_postal_code;
      }

      return result;
    }, {})
  ).sort((a, b) => b.orders.length - a.orders.length);

  // Recherche
  const filteredCustomers = customers.filter((customer) => {
    const value = search.toLowerCase().trim();

    return (
      customer.name.toLowerCase().includes(value) ||
      customer.phone.toLowerCase().includes(value) ||
      customer.email.toLowerCase().includes(value) ||
      customer.city.toLowerCase().includes(value)
    );
  });

  // Statistiques
  const totalCustomers = customers.length;

  const totalOrders = orders.length;

  const totalSales = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  return (
    <div className="customers-admin">

      {/* En-tête */}
      <div className="customers-header">
        <div>
          <h2>Gestion des clientes</h2>
          <p>
            Consultez les informations et l'activité de vos clientes.
          </p>
        </div>

        <button
          className="customers-refresh-button"
          onClick={loadCustomers}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Actualiser
        </button>
      </div>

      {/* Statistiques */}
      <section className="customers-summary">

        <article>
          <div className="customers-summary-icon">
            <Users size={21} />
          </div>

          <div>
            <span>Total clientes</span>
            <strong>{totalCustomers}</strong>
          </div>
        </article>

        <article>
          <div className="customers-summary-icon">
            <ShoppingBag size={21} />
          </div>

          <div>
            <span>Total commandes</span>
            <strong>{totalOrders}</strong>
          </div>
        </article>

        <article>
          <div className="customers-summary-icon">
            <Wallet size={21} />
          </div>

          <div>
            <span>Montant des commandes</span>
            <strong>{totalSales.toFixed(2)} DT</strong>
          </div>
        </article>

      </section>

      {/* Recherche */}
      <div className="customers-toolbar">
        <div className="customers-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email ou ville..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="customers-table-container">
        <table className="customers-table">

          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contact</th>
              <th>Ville</th>
              <th>Commandes</th>
              <th>Total achats</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="customers-empty">
                  Chargement des clientes...
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" className="customers-empty">
                  <Users size={32} />
                  <strong>Aucune cliente trouvée</strong>
                  <span>
                    Les clientes apparaîtront après leurs commandes.
                  </span>
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id}>

                  <td>
                    <div className="customer-name-cell">
                      <div className="customer-avatar">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>

                      <strong>{customer.name}</strong>
                    </div>
                  </td>

                  <td>
                    <div className="customer-contact">
                      <span>
                        <Phone size={14} />
                        {customer.phone || "—"}
                      </span>

                      <span>
                        <Mail size={14} />
                        {customer.email || "—"}
                      </span>
                    </div>
                  </td>

                  <td>{customer.city || "—"}</td>

                  <td>
                    <strong>{customer.orders.length}</strong>
                  </td>

                  <td>
                    <strong>
                      {customer.totalSpent.toFixed(2)} DT
                    </strong>
                  </td>

                  <td>
                    <button
                      className="customer-view-button"
                      onClick={() => setSelectedCustomer(customer)}
                      aria-label="Voir les détails de la cliente"
                    >
                      <Eye size={17} />
                    </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      {/* Détails cliente */}
      {selectedCustomer && (
        <div
          className="customer-modal-overlay"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="customer-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="customer-modal-header">
              <div>
                <span>FICHE CLIENTE</span>
                <h3>{selectedCustomer.name}</h3>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
              >
                <X size={21} />
              </button>
            </div>

            <div className="customer-modal-content">

              {/* Coordonnées */}
              <section className="customer-info-section">
                <h4>Informations personnelles</h4>

                <div className="customer-info-row">
                  <Phone size={17} />
                  <span>
                    {selectedCustomer.phone || "Téléphone non renseigné"}
                  </span>
                </div>

                <div className="customer-info-row">
                  <Mail size={17} />
                  <span>
                    {selectedCustomer.email || "Email non renseigné"}
                  </span>
                </div>

                <div className="customer-info-row">
                  <MapPin size={17} />
                  <span>
                    {selectedCustomer.address || "Adresse non renseignée"}
                    {selectedCustomer.city
                      ? `, ${selectedCustomer.city}`
                      : ""}
                  </span>
                </div>

                {selectedCustomer.postalCode && (
                  <div className="customer-info-row">
                    <MapPin size={17} />
                    <span>
                      Code postal : {selectedCustomer.postalCode}
                    </span>
                  </div>
                )}
              </section>

              {/* Résumé */}
              <section className="customer-purchase-summary">
                <div>
                  <span>Commandes</span>
                  <strong>{selectedCustomer.orders.length}</strong>
                </div>

                <div>
                  <span>Total achats</span>
                  <strong>
                    {selectedCustomer.totalSpent.toFixed(2)} DT
                  </strong>
                </div>
              </section>

              {/* Historique */}
              <section className="customer-history">
                <h4>Historique des commandes</h4>

                {selectedCustomer.orders.map((order) => (
                  <div
                    className="customer-history-item"
                    key={order.id}
                  >
                    <div>
                      <strong>
                        Commande #{order.order_number}
                      </strong>

                      <span>
                        <Calendar size={13} />
                        {formatDate(order.created_at)}
                      </span>
                    </div>

                    <div className="customer-history-right">
                      <strong>
                        {Number(order.total || 0).toFixed(2)} DT
                      </strong>

                      <span
                        className={`order-status ${order.status}`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </section>

            </div>

            <div className="customer-modal-actions">
              <button
                onClick={() => setSelectedCustomer(null)}
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
