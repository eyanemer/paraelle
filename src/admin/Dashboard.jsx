
import { useEffect, useState } from "react";
import Products from "./Products";
import Promotions from "./Promotions";
import Orders from "./Orders";
import Customers from "./Customers";
import { supabase } from "../lib/supabase";
import { logoutUser } from "../lib/auth";

import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  Users,
  Settings,
  LogOut,
  Menu,
  TrendingUp,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  CalendarDays,
  CheckCircle,
} from "lucide-react";

const menuItems = [
  { label: "Vue d'ensemble", icon: LayoutDashboard },
  { label: "Produits", icon: Package },
  { label: "Commandes", icon: ShoppingBag },
  { label: "Promotions", icon: Tag },
  { label: "Clients", icon: Users },
];

const formatMoney = (value) =>
  new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const statusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default function Dashboard() {
  const [activePage, setActivePage] = useState("Vue d'ensemble");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    orders: 0,
    promotions: 0,
    revenue: 0,
  });

  const [orders, setOrders] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // CHARGEMENT DES DONNÉES BI
  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        productsResult,
        ordersResult,
        couponsResult,
        itemsResult,
      ] = await Promise.all([
        supabase.from("products").select("*"),

        supabase.from("orders").select("*").order("created_at", {
          ascending: false,
        }),

        supabase.from("coupons").select("*"),

        supabase
          .from("order_items")
          .select(
            "product_id, product_name, quantity, line_total, order_id"
          ),
      ]);

      if (productsResult.error) throw productsResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (couponsResult.error) throw couponsResult.error;
      if (itemsResult.error) throw itemsResult.error;

      const products = productsResult.data || [];
      const allOrders = ordersResult.data || [];
      const coupons = couponsResult.data || [];
      const orderItems = itemsResult.data || [];

      // PRODUITS ET PROMOTIONS ACTIFS
      const activeProducts = products.filter(
        (product) => product.is_active === true
      );

      const activeCoupons = coupons.filter(
        (coupon) => coupon.is_active === true
      );

      // COMMANDES LIVRÉES
      const deliveredOrders = allOrders.filter(
        (order) => order.status === "delivered"
      );

      // CHIFFRE D'AFFAIRES
      const revenue = deliveredOrders.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0
      );

      // NOMBRE DE CLIENTS DISTINCTS
      const customers = new Set(
        allOrders.map((order) =>
          (
            order.customer_phone ||
            order.customer_email ||
            order.customer_name ||
            order.id
          )
            .toString()
            .trim()
            .toLowerCase()
        )
      );

      // STATISTIQUES GÉNÉRALES
      setStats({
        products: activeProducts.length,
        customers: customers.size,
        orders: allOrders.length,
        promotions: activeCoupons.length,
        revenue,
      });

      // SIX DERNIÈRES COMMANDES
      setOrders(allOrders.slice(0, 6));

      // CHIFFRE D'AFFAIRES DES SIX DERNIERS MOIS
      const months = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - i);

        const month = date.getMonth();
        const year = date.getFullYear();

        const monthOrders = deliveredOrders.filter((order) => {
          const orderDate = new Date(order.created_at);

          return (
            orderDate.getMonth() === month &&
            orderDate.getFullYear() === year
          );
        });

        const total = monthOrders.reduce(
          (sum, order) => sum + Number(order.total || 0),
          0
        );

        months.push({
          label: date.toLocaleDateString("fr-FR", {
            month: "short",
          }),
          total,
        });
      }

      setMonthlyData(months);

      // RÉPARTITION DES COMMANDES
      const statusConfig = [
        { key: "pending", label: "En attente" },
        { key: "confirmed", label: "Confirmées" },
        { key: "processing", label: "En préparation" },
        { key: "shipped", label: "Expédiées" },
        { key: "delivered", label: "Livrées" },
        { key: "cancelled", label: "Annulées" },
      ];

      setStatusData(
        statusConfig.map((status) => ({
          ...status,
          count: allOrders.filter(
            (order) => order.status === status.key
          ).length,
        }))
      );

      // MEILLEURS PRODUITS VENDUS
      const deliveredOrderIds = new Set(
        deliveredOrders.map((order) => order.id)
      );

      const productSales = {};

      orderItems
        .filter((item) => deliveredOrderIds.has(item.order_id))
        .forEach((item) => {
          const key = item.product_id || item.product_name;

          if (!productSales[key]) {
            productSales[key] = {
              id: key,
              name: item.product_name || "Produit",
              quantity: 0,
              revenue: 0,
            };
          }

          productSales[key].quantity += Number(item.quantity || 0);
          productSales[key].revenue += Number(item.line_total || 0);
        });

      setTopProducts(
        Object.values(productSales)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)
      );

      // ALERTES DE STOCK
      setLowStockProducts(
        activeProducts
          .filter((product) => Number(product.stock || 0) <= 5)
          .sort(
            (a, b) =>
              Number(a.stock || 0) - Number(b.stock || 0)
          )
      );
    } catch (err) {
      console.error("Erreur dashboard :", err);
      setError("Impossible de charger les statistiques.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // DÉCONNEXION
  const handleLogout = async () => {
    try {
      await logoutUser();
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      alert("Impossible de vous déconnecter.");
    }
  };

  const maxRevenue = Math.max(
    ...monthlyData.map((item) => item.total),
    1
  );

  const totalStatusOrders = statusData.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const getStatusClass = (status) => {
    return status || "pending";
  };

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>PARAÉLLE</h2>
          <span>ADMINISTRATION</span>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                onClick={() => setActivePage(item.label)}
                className={`admin-nav-item ${
                  activePage === item.label ? "active" : ""
                }`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            className={`admin-nav-item ${
              activePage === "Paramètres" ? "active" : ""
            }`}
            onClick={() => setActivePage("Paramètres")}
          >
            <Settings size={19} />
            <span>Paramètres</span>
          </button>

          <button
            className="admin-nav-item"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="admin-main">

        {activePage === "Produits" ? (
          <Products />
        ) : activePage === "Promotions" ? (
          <Promotions />
        ) : activePage === "Commandes" ? (
          <Orders />
        ) : activePage === "Clients" ? (
          <Customers />
        ) : activePage === "Vue d'ensemble" ? (

          <div className="bi-dashboard">

            {/* HEADER */}
            <header className="bi-header">
              <div>
                <span className="bi-eyebrow">
                  ESPACE DE PILOTAGE
                </span>

                <h1>Vue d'ensemble</h1>

                <p>
                  Suivez les performances de votre boutique PARAÉLLE.
                </p>
              </div>

              <div className="bi-header-actions">
                <span className="bi-date">
                  <CalendarDays size={16} />

                  {new Date().toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>

                <button
                  className="bi-refresh"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  title="Actualiser les données"
                >
                  <RefreshCw size={17} />
                </button>

                <button className="admin-menu-button">
                  <Menu size={22} />
                </button>
              </div>
            </header>

            {error && (
              <div className="bi-error">{error}</div>
            )}

            {loading ? (
              <div className="bi-loading">
                <RefreshCw size={25} className="bi-spinner" />
                <p>Chargement de vos statistiques...</p>
              </div>
            ) : (
              <>

                {/* BANNIÈRE */}
                <section className="bi-welcome">
                  <div>
                    <span>BIENVENUE CHEZ PARAÉLLE</span>

                    <h2>
                      Votre activité, en un coup d'œil.
                    </h2>

                    <p>
                      Retrouvez les indicateurs essentiels pour
                      suivre et développer votre boutique.
                    </p>
                  </div>

                  <div className="bi-welcome-icon">
                    <TrendingUp size={48} />
                  </div>
                </section>

                {/* INDICATEURS KPI */}
                <section className="bi-kpi-grid">

                  <article className="bi-kpi-card">
                    <div className="bi-kpi-top">
                      <span>Chiffre d'affaires livré</span>

                      <div className="bi-kpi-icon revenue">
                        <Wallet size={21} />
                      </div>
                    </div>

                    <strong>{formatMoney(stats.revenue)}</strong>

                    <small>
                      Commandes livrées uniquement
                    </small>
                  </article>

                  <article className="bi-kpi-card">
                    <div className="bi-kpi-top">
                      <span>Commandes</span>

                      <div className="bi-kpi-icon orders">
                        <ShoppingBag size={21} />
                      </div>
                    </div>

                    <strong>{stats.orders}</strong>

                    <small>
                      Toutes les commandes enregistrées
                    </small>
                  </article>

                  <article className="bi-kpi-card">
                    <div className="bi-kpi-top">
                      <span>Clients</span>

                      <div className="bi-kpi-icon customers">
                        <Users size={21} />
                      </div>
                    </div>

                    <strong>{stats.customers}</strong>

                    <small>
                      Clients identifiés par leurs coordonnées
                    </small>
                  </article>

                  <article className="bi-kpi-card">
                    <div className="bi-kpi-top">
                      <span>Produits actifs</span>

                      <div className="bi-kpi-icon products">
                        <Package size={21} />
                      </div>
                    </div>

                    <strong>{stats.products}</strong>

                    <small>
                      Produits visibles dans la boutique
                    </small>
                  </article>

                </section>

                {/* GRAPHIQUES */}
                <section className="bi-secondary-grid">

                  <article className="bi-panel">
                    <div className="bi-panel-header">
                      <div>
                        <h3>
                          Évolution du chiffre d'affaires
                        </h3>

                        <p>
                          Commandes livrées · 6 derniers mois
                        </p>
                      </div>

                      <div className="bi-panel-icon">
                        <TrendingUp size={19} />
                      </div>
                    </div>

                    <div className="bi-chart">
                      {monthlyData.map((item, index) => (
                        <div
                          className="bi-chart-column"
                          key={index}
                        >
                          <span className="bi-chart-value">
                            {item.total.toFixed(0)} DT
                          </span>

                          <div className="bi-chart-bar-area">
                            <div
                              className="bi-chart-bar"
                              style={{
                                height: `${
                                  item.total > 0
                                    ? Math.max(
                                        (item.total / maxRevenue) * 100,
                                        5
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>

                          <span className="bi-chart-label">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="bi-panel">
                    <div className="bi-panel-header">
                      <div>
                        <h3>État des commandes</h3>
                        <p>Répartition par statut</p>
                      </div>

                      <div className="bi-panel-icon">
                        <ShoppingBag size={19} />
                      </div>
                    </div>

                    <div className="bi-status-total">
                      <strong>{totalStatusOrders}</strong>
                      <span>Commandes au total</span>
                    </div>

                    <div className="bi-status-list">
                      {statusData.map((item) => (
                        <div
                          className="bi-status-item"
                          key={item.key}
                        >
                          <div className="bi-status-info">
                            <span
                              className={`bi-status-dot ${item.key}`}
                            />
                            <span>{item.label}</span>
                          </div>

                          <strong>{item.count}</strong>
                        </div>
                      ))}
                    </div>
                  </article>

                </section>

                {/* COMMANDES RÉCENTES ET PROMOTIONS */}
                <section className="bi-bottom-grid">

                  <article className="bi-panel bi-recent-panel">
                    <div className="bi-panel-header">
                      <div>
                        <h3>Commandes récentes</h3>
                        <p>
                          Les dernières activités de votre boutique
                        </p>
                      </div>

                      <button
                        className="bi-see-all"
                        onClick={() =>
                          setActivePage("Commandes")
                        }
                      >
                        Tout voir
                        <ArrowUpRight size={15} />
                      </button>
                    </div>

                    {orders.length === 0 ? (
                      <div className="bi-empty">
                        <ShoppingBag size={30} />
                        <p>
                          Aucune commande pour le moment.
                        </p>
                      </div>
                    ) : (
                      <div className="bi-recent-table-wrap">
                        <table className="bi-recent-table">
                          <thead>
                            <tr>
                              <th>Commande</th>
                              <th>Client</th>
                              <th>Date</th>
                              <th>Montant</th>
                              <th>Statut</th>
                            </tr>
                          </thead>

                          <tbody>
                            {orders.map((order) => (
                              <tr key={order.id}>
                                <td>
                                  #{order.order_number || order.id}
                                </td>

                                <td>
                                  {order.customer_name || "Client"}
                                </td>

                                <td>
                                  {formatDate(order.created_at)}
                                </td>

                                <td>
                                  {formatMoney(order.total)}
                                </td>

                                <td>
                                  <span
                                    className={`bi-order-status ${getStatusClass(
                                      order.status
                                    )}`}
                                  >
                                    {statusLabels[order.status] ||
                                      order.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>

                  <article className="bi-panel bi-promo-panel">
                    <div className="bi-promo-icon">
                      <Tag size={24} />
                    </div>

                    <span>MARKETING</span>

                    <h3>Vos promotions</h3>

                    <strong>{stats.promotions}</strong>

                    <p>
                      Promotions actuellement actives
                    </p>

                    <button
                      className="bi-promo-button"
                      onClick={() =>
                        setActivePage("Promotions")
                      }
                    >
                      Gérer les promotions
                      <ArrowUpRight size={16} />
                    </button>
                  </article>

                </section>

                {/* ANALYSE DES PRODUITS ET STOCK */}
                <section className="bi-insights-grid">

                  {/* MEILLEURS PRODUITS */}
                  <article className="bi-panel">
                    <div className="bi-panel-header">
                      <div>
                        <h3>Meilleurs produits vendus</h3>
                        <p>
                          Classement selon les quantités livrées
                        </p>
                      </div>

                      <div className="bi-panel-icon">
                        <TrendingUp size={19} />
                      </div>
                    </div>

                    {topProducts.length === 0 ? (
                      <div className="bi-empty">
                        <Package size={30} />
                        <p>
                          Aucune vente livrée pour le moment.
                        </p>
                      </div>
                    ) : (
                      <div className="bi-products-ranking">
                        {topProducts.map((product, index) => (
                          <div
                            className="bi-product-rank"
                            key={product.id}
                          >
                            <div className="bi-rank-number">
                              {index + 1}
                            </div>

                            <div className="bi-rank-info">
                              <strong>{product.name}</strong>

                              <span>
                                {product.quantity} unité(s) vendue(s)
                              </span>
                            </div>

                            <strong className="bi-rank-revenue">
                              {formatMoney(product.revenue)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>

                  {/* ALERTES STOCK */}
                  <article className="bi-panel">
                    <div className="bi-panel-header">
                      <div>
                        <h3>Alertes de stock</h3>
                        <p>
                          Produits nécessitant un réapprovisionnement
                        </p>
                      </div>

                      <div className="bi-panel-icon bi-stock-icon">
                        <Package size={19} />
                      </div>
                    </div>

                    <div className="bi-stock-summary">
                      <strong>
                        {lowStockProducts.length}
                      </strong>

                      <span>
                        Produit(s) avec un stock faible
                      </span>
                    </div>

                    {lowStockProducts.length === 0 ? (
                      <div className="bi-stock-empty">
                        <CheckCircle size={25} />

                        <p>
                          Tous vos stocks sont suffisants.
                        </p>
                      </div>
                    ) : (
                      <div className="bi-stock-list">
                        {lowStockProducts
                          .slice(0, 5)
                          .map((product) => (
                            <div
                              className="bi-stock-item"
                              key={product.id}
                            >
                              <div>
                                <strong>{product.name}</strong>
                                <span>Stock disponible</span>
                              </div>

                              <span
                                className={`bi-stock-badge ${
                                  Number(product.stock) === 0
                                    ? "out"
                                    : "low"
                                }`}
                              >
                                {Number(product.stock) === 0
                                  ? "Épuisé"
                                  : `${product.stock} unité(s)`}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}

                    <button
                      className="bi-stock-button"
                      onClick={() =>
                        setActivePage("Produits")
                      }
                    >
                      Gérer les produits
                      <ArrowUpRight size={16} />
                    </button>
                  </article>

                </section>

              </>
            )}
          </div>

        ) : (
          <div className="bi-dashboard">
            <header className="bi-header">
              <div>
                <h1>Paramètres</h1>
                <p>
                  Gérez les paramètres de votre administration.
                </p>
              </div>
            </header>

            <div className="bi-panel">
              <p>Cette section sera bientôt disponible.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
