
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  UserRound,
} from "lucide-react";

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    function updateCartCount() {
      const cart = JSON.parse(
        localStorage.getItem("paraelle-cart") || "[]"
      );

      const total = cart.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );

      setCartCount(total);
    }

    updateCartCount();

    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  return (
    <header className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="nav-logo">
          PARAÉLLE
          <span>BEAUTY • CARE • WELLNESS</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Accueil</Link>
          <Link to="/shop">Boutique</Link>
          <Link to="/#brands">Nos marques</Link>
          <Link to="/#promotions">Promotions</Link>
          <Link to="/#contact">Contact</Link>
        </nav>

        <div className="nav-actions">
          <button aria-label="Rechercher">
            <Search />
          </button>

          <Link to="/login" aria-label="Mon compte">
            <UserRound />
          </Link>

          <Link
            to="/cart"
            aria-label="Panier"
            style={{ position: "relative" }}
          >
            <ShoppingBag />

            {cartCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-9px",
                  right: "-10px",
                  background: "#244C3D",
                  color: "#fff",
                  borderRadius: "50%",
                  minWidth: "19px",
                  height: "19px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: "bold",
                  padding: "0 4px",
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
