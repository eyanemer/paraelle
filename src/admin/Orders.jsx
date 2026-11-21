
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import * as XLSX from "xlsx";

import {
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
  X,
  Package,
  Clock,
  CheckCircle,
  Truck,
  Printer,
  FileSpreadsheet,
} from "lucide-react";

const statusOptions = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

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

function getOrderAddress(order) {
  return (
    order.customer_address ||
    order.addresses?.address_line ||
    "—"
  );
}

function getOrderCity(order) {
  return (
    order.customer_city ||
    order.addresses?.city ||
    "—"
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Charger les commandes
  async function loadOrders() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          addresses (
            full_name,
            phone,
            address_line,
            city,
            postal_code,
            country
          ),
          order_items (
            id,
            product_name,
            product_image,
            product_sku,
            quantity,
            unit_price,
            discount_amount,
            line_total
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error("Erreur chargement commandes :", error);
      alert("Impossible de charger les commandes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  // Exporter les commandes en Excel
  function exportOrders() {
    if (orders.length === 0) {
      alert("Aucune commande à exporter.");
      return;
    }

    const excelData = orders.map((order) => {
      const products = (order.order_items || [])
        .map(
          (item) =>
            `${item.product_name} (x${item.quantity})`
        )
        .join(", ");

      return {
        "N° commande": order.order_number,
        "Date": order.created_at
          ? new Date(order.created_at).toLocaleString("fr-FR")
          : "",
        "Nom cliente": order.customer_name || "",
        "Téléphone": order.customer_phone || "",
        "Email": order.customer_email || "",
        "Adresse": getOrderAddress(order),
        "Ville": getOrderCity(order),
        "Code postal":
          order.customer_postal_code ||
          order.addresses?.postal_code ||
          "",
        "Produits": products,
        "Sous-total (DT)": Number(order.subtotal || 0),
        "Livraison (DT)": Number(order.delivery_fee || 0),
        "Remise (DT)": Number(order.discount_amount || 0),
        "Total (DT)": Number(order.total || 0),
        "Paiement": "Paiement à la livraison",
        "Statut": statusLabels[order.status] || order.status,
        "Remarques": order.notes || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 14 },
      { wch: 20 },
      { wch: 25 },
      { wch: 17 },
      { wch: 28 },
      { wch: 35 },
      { wch: 20 },
      { wch: 14 },
      { wch: 50 },
      { wch: 16 },
      { wch: 15 },
      { wch: 14 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 35 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Commandes"
    );

    const fileName = `PARAELLE_Commandes_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    XLSX.writeFile(workbook, fileName);
  }

  // Modifier le statut
  async function updateStatus(orderId, newStatus) {
    setUpdating(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      setOrders((previous) =>
        previous.map((order) =>
          order.id === orderId
            ? { ...order, ...data }
            : order
        )
      );

      setSelectedOrder((previous) =>
        previous
          ? { ...previous, ...data }
          : previous
      );
    } catch (error) {
      console.error("Erreur modification statut :", error);
      alert("Impossible de modifier le statut.");
    } finally {
      setUpdating(false);
    }
  }

  // Recherche et filtrage
  const filteredOrders = orders.filter((order) => {
    const searchValue = search.toLowerCase().trim();

    const matchesSearch =
      String(order.order_number ?? "")
        .toLowerCase()
        .includes(searchValue) ||
      (order.customer_name || "")
        .toLowerCase()
        .includes(searchValue) ||
      (order.customer_phone || "")
        .toLowerCase()
        .includes(searchValue) ||
      (order.customer_city || "")
        .toLowerCase()
        .includes(searchValue);

    const matchesStatus =
      statusFilter === "all" ||
      order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Statistiques
  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.status === "pending"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "delivered"
  ).length;

  const totalRevenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce(
      (total, order) => total + Number(order.total || 0),
      0
    );

  return (
    <div className="orders-admin">

      {/* En-tête */}
      <div className="orders-header">
        <div>
          <h2>Gestion des commandes</h2>
          <p>
            Consultez et gérez les commandes de vos clientes.
          </p>
        </div>

        <div className="orders-header-actions">
          <button
            className="orders-export-button"
            onClick={exportOrders}
            disabled={orders.length === 0}
          >
            <FileSpreadsheet size={18} />
            Exporter Excel
          </button>

          <button
            className="orders-refresh-button"
            onClick={loadOrders}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <section className="orders-summary">
        <article>
          <ShoppingBag />
          <span>Total commandes</span>
          <strong>{totalOrders}</strong>
        </article>

        <article>
          <Clock />
          <span>En attente</span>
          <strong>{pendingOrders}</strong>
        </article>

        <article>
          <CheckCircle />
          <span>Livrées</span>
          <strong>{deliveredOrders}</strong>
        </article>

        <article>
          <Truck />
          <span>Montant des commandes</span>
          <strong>{totalRevenue.toFixed(2)} DT</strong>
        </article>
      </section>

      {/* Recherche et filtres */}
      <section className="orders-toolbar">
        <div className="orders-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Rechercher une commande, une cliente..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="all">Tous les statuts</option>

          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </section>

      {/* Tableau */}
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Commande</th>
              <th>Cliente</th>
              <th>Date</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="orders-empty">
                  Chargement des commandes...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="orders-empty">
                  <Package size={32} />
                  <strong>Aucune commande trouvée</strong>
                  <span>
                    Les commandes apparaîtront ici.
                  </span>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>#{order.order_number}</strong>
                  </td>

                  <td>
                    <div className="order-customer">
                      <strong>
                        {order.customer_name || "Cliente"}
                      </strong>

                      <span>
                        {order.customer_email ||
                          order.customer_phone ||
                          "—"}
                      </span>
                    </div>
                  </td>

                  <td>{formatDate(order.created_at)}</td>

                  <td>
                    <strong>
                      {Number(order.total || 0).toFixed(2)} DT
                    </strong>
                  </td>

                  <td>
                    <span
                      className={`order-status ${order.status}`}
                    >
                      {statusLabels[order.status] ||
                        order.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="order-view-button"
                      onClick={() => setSelectedOrder(order)}
                      aria-label="Voir la commande"
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

      {/* Détails de la commande */}
      {selectedOrder && (
        <div
          className="order-modal-overlay"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="order-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="order-modal-header no-print">
              <div>
                <span>DÉTAILS DE LA COMMANDE</span>
                <h3>#{selectedOrder.order_number}</h3>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
              >
                <X size={21} />
              </button>
            </div>

            {/* Partie imprimable */}
            <div className="order-modal-content">

              <div className="print-order-header">
                <h1>PARAÉLLE</h1>
                <p>BEAUTY • CARE • WELLNESS</p>
                <h2>BON DE COMMANDE</h2>
                <strong>
                  Commande #{selectedOrder.order_number}
                </strong>
                <span>
                  Date : {formatDate(selectedOrder.created_at)}
                </span>
              </div>

              <div className="print-customer">
                <h4>Informations cliente</h4>

                <p>
                  <strong>Nom :</strong>{" "}
                  {selectedOrder.customer_name || "—"}
                </p>

                <p>
                  <strong>Téléphone :</strong>{" "}
                  {selectedOrder.customer_phone || "—"}
                </p>

                <p>
                  <strong>Adresse :</strong>{" "}
                  {getOrderAddress(selectedOrder)}
                </p>

                <p>
                  <strong>Ville :</strong>{" "}
                  {getOrderCity(selectedOrder)}
                </p>

                <p>
                  <strong>Code postal :</strong>{" "}
                  {selectedOrder.customer_postal_code ||
                    selectedOrder.addresses?.postal_code ||
                    "—"}
                </p>
              </div>

              <div className="order-items-section">
                <h4>Produits commandés</h4>

                {selectedOrder.order_items?.length > 0 ? (
                  selectedOrder.order_items.map((item) => (
                    <div className="order-item" key={item.id}>
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                        />
                      )}

                      <div className="order-item-info">
                        <strong>{item.product_name}</strong>

                        <span>
                          Quantité : {item.quantity}
                        </span>

                        <span>
                          Prix unitaire :{" "}
                          {Number(item.unit_price).toFixed(2)} DT
                        </span>
                      </div>

                      <strong>
                        {Number(item.line_total).toFixed(2)} DT
                      </strong>
                    </div>
                  ))
                ) : (
                  <p>Aucun produit enregistré.</p>
                )}
              </div>

              <div className="order-detail-item">
                <span>Mode de paiement</span>
                <strong>Paiement à la livraison</strong>
              </div>

              <div className="order-detail-item">
                <span>Statut</span>
                <strong>
                  {statusLabels[selectedOrder.status] ||
                    selectedOrder.status}
                </strong>
              </div>

              <div className="order-detail-item">
                <span>Sous-total</span>
                <strong>
                  {Number(selectedOrder.subtotal || 0).toFixed(2)} DT
                </strong>
              </div>

              <div className="order-detail-item">
                <span>Livraison</span>
                <strong>
                  {Number(selectedOrder.delivery_fee || 0).toFixed(2)} DT
                </strong>
              </div>

              {Number(selectedOrder.discount_amount || 0) > 0 && (
                <div className="order-detail-item">
                  <span>Remise</span>
                  <strong>
                    -{Number(selectedOrder.discount_amount).toFixed(2)} DT
                  </strong>
                </div>
              )}

              <div className="order-detail-item order-print-total">
                <span>Total à payer</span>
                <strong>
                  {Number(selectedOrder.total || 0).toFixed(2)} DT
                </strong>
              </div>

              {selectedOrder.notes && (
                <div className="order-detail-item">
                  <span>Remarque</span>
                  <strong>{selectedOrder.notes}</strong>
                </div>
              )}

              {/* Modifier le statut */}
              <div className="order-status-editor no-print">
                <label>Modifier le statut</label>

                <select
                  value={selectedOrder.status}
                  onChange={(event) =>
                    updateStatus(
                      selectedOrder.id,
                      event.target.value
                    )
                  }
                  disabled={updating}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Actions */}
            <div className="order-modal-actions no-print">
              <button
                className="order-print-button"
                onClick={() => window.print()}
              >
                <Printer size={17} />
                Imprimer le bon
              </button>

              <button
                className="order-modal-close"
                onClick={() => setSelectedOrder(null)}
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
