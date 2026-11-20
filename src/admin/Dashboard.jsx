
import { useState } from "react";
import Products from "./Products";
import Promotions from "./Promotions";

import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  Users,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";

const menuItems = [
  { label: "Vue d'ensemble", icon: LayoutDashboard },
  { label: "Produits", icon: Package },
  { label: "Commandes", icon: ShoppingBag },
  { label: "Promotions", icon: Tag },
  { label: "Clients", icon: Users },
];

export default function Dashboard() {
  const [activePage, setActivePage] = useState("Vue d'ensemble");

  return (
    <div className="admin-layout">
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
          <button className="admin-nav-item">
            <Settings size={19} />
            <span>Paramètres</span>
          </button>

          <button className="admin-nav-item">
            <LogOut size={19} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
       {activePage === "Produits" ? (
  <Products />
) : activePage === "Promotions" ? (
  <Promotions />
) : (
          <>
            <header className="admin-header">
              <div>
                <h1>{activePage}</h1>
                <p>Bienvenue dans votre espace d'administration.</p>
              </div>

              <button className="admin-menu-button">
                <Menu size={22} />
              </button>
            </header>

            {activePage === "Vue d'ensemble" && (
              <>
                <section className="admin-welcome">
                  <div>
                    <span>ESPACE ADMINISTRATEUR</span>
                    <h2>Bienvenue chez PARAÉLLE</h2>
                    <p>
                      Gérez votre boutique, vos produits et vos commandes
                      depuis un seul endroit.
                    </p>
                  </div>
                </section>

                <section className="admin-stats">
                  <article className="admin-stat-card">
                    <Package />
                    <span>Produits</span>
                    <strong>1</strong>
                  </article>

                  <article className="admin-stat-card">
                    <ShoppingBag />
                    <span>Commandes</span>
                    <strong>0</strong>
                  </article>

                  <article className="admin-stat-card">
                    <Users />
                    <span>Clients</span>
                    <strong>0</strong>
                  </article>

                  <article className="admin-stat-card">
                    <Tag />
                    <span>Promotions</span>
                    <strong>0</strong>
                  </article>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
