
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";import Navbar from "./components/layout/Navbar";
import { useEffect, useState } from "react";
import { getFeaturedProducts } from "./lib/products";
import Dashboard from "./admin/Dashboard";
import { loginUser, isAdmin } from "./lib/auth";


function Home() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <span className="hero-label">BEAUTY • CARE • WELLNESS</span>

            <h1>
              Prenez soin de vous,
              <span> naturellement.</span>
            </h1>

            <p>
              Découvrez une sélection de produits de parapharmacie
              pour prendre soin de votre peau, de votre beauté
              et de votre bien-être au quotidien.
            </p>

            <a href="/shop" className="hero-button">
              Découvrir la boutique
            </a>
          </div>

          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1000"
              alt="Produits de soin et de beauté"
            />
          </div>
        </div>
      </section>
      <Categories />
      <FeaturedProducts />
      <PromoBanner />
      <Benefits />
      <Footer />
    </main>
  );
}


function Categories() {
  const categories = [
    {
      name: "Soin du visage",
      image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600",
    },
    {
      name: "Soin des cheveux",
      image: "https://images.unsplash.com/photo-1600612253971-422e7f7faeb6?w=600",
    },
    {
      name: "Soin du corps",
      image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600",
    },
    {
      name: "Bien-être",
      image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600",
    },
  ];

  return (
    <section className="categories-section">
      <div className="container">
        <div className="section-heading">
          <span>EXPLOREZ NOS UNIVERS</span>
          <h2>Nos catégories</h2>
          <p>Trouvez les essentiels adaptés à vos besoins.</p>
        </div>

        <div className="categories-grid">
          {categories.map((category) => (
            <a href="/shop" className="category-card" key={category.name}>
              <img src={category.image} alt={category.name} />
              <div className="category-overlay">
                <h3>{category.name}</h3>
                <span>Découvrir →</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}


function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getFeaturedProducts();
        setProducts(data);
      } catch (err) {
        setError("Impossible de charger les produits.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  if (loading) {
    return <section className="featured-section">
      <div className="container">Chargement des produits...</div>
    </section>;
  }

  if (error) {
    return <section className="featured-section">
      <div className="container">{error}</div>
    </section>;
  }

  return (
    <section className="featured-section">
      <div className="container">
        <div className="section-heading">
          <span>NOTRE SÉLECTION</span>
          <h2>Nos produits populaires</h2>
          <p>Les essentiels pour prendre soin de vous.</p>
        </div>

        {products.length === 0 ? (
          <p className="empty-products">
            Nos produits seront bientôt disponibles.
          </p>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  {product.compare_at_price > product.price && (
                    <span className="discount-badge">
                      -{Math.round(
                        (1 - product.price / product.compare_at_price) * 100
                      )}%
                    </span>
                  )}

                  <img
                    src={product.image_url || "/placeholder.png"}
                    alt={product.name}
                  />
                </div>

                <div className="product-info">
                  <span className="product-brand">
                    {product.brands?.name || "PARAÉLLE"}
                  </span>

                  <h3>{product.name}</h3>

                  <div className="product-prices">
                    <strong>{product.price} DT</strong>

                    {product.compare_at_price > product.price && (
                      <del>{product.compare_at_price} DT</del>
                    )}
                  </div>

                  <button className="add-cart-button">
                    Découvrir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}



function PromoBanner() {
  return (
    <section className="promo-section">
      <div className="container promo-content">
        <div>
          <span>PRENEZ SOIN DE VOUS</span>
          <h2>La beauté mérite<br />une attention particulière.</h2>
          <p>
            Découvrez nos offres exclusives sur une sélection
            de produits beauté et bien-être.
          </p>
          <a href="/shop">Découvrir les offres →</a>
        </div>

        <div className="promo-decoration">
          <span>PARAÉLLE</span>
          <strong>BEAUTY<br />& WELLNESS</strong>
        </div>
      </div>
    </section>
  );
}


function Benefits() {
  const benefits = [
    {
      icon: "✦",
      title: "Produits authentiques",
      description: "Une sélection de produits de qualité auprès de marques reconnues.",
    },
    {
      icon: "♡",
      title: "Conseils personnalisés",
      description: "Des essentiels adaptés à vos besoins et à votre routine.",
    },
    {
      icon: "♧",
      title: "Livraison en Tunisie",
      description: "Recevez vos commandes directement chez vous.",
    },
    {
      icon: "✓",
      title: "Paiement à la livraison",
      description: "Commandez en toute simplicité et payez à la réception.",
    },
  ];

  return (
    <section className="benefits-section">
      <div className="container">
        <div className="section-heading">
          <span>NOTRE ENGAGEMENT</span>
          <h2>Pourquoi choisir PARAÉLLE ?</h2>
          <p>Votre bien-être est au cœur de chacune de nos attentions.</p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit) => (
            <div className="benefit-card" key={benefit.title}>
              <div className="benefit-icon">{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container footer-grid">
        <div className="footer-brand">
          <h2>PARAÉLLE</h2>
          <span>BEAUTY • CARE • WELLNESS</span>
          <p>
            Votre beauté, notre priorité.
            Découvrez une sélection de produits
            pour votre beauté et votre bien-être.
          </p>
        </div>

        <div>
          <h3>Navigation</h3>
          <a href="/">Accueil</a>
          <a href="/shop">Boutique</a>
          <a href="#brands">Nos marques</a>
          <a href="#promotions">Promotions</a>
        </div>

        <div>
          <h3>Service client</h3>
          <a href="#contact">Nous contacter</a>
          <a href="#delivery">Livraison</a>
          <a href="#payment">Paiement</a>
          <a href="#faq">FAQ</a>
        </div>

        <div>
          <h3>Contact</h3>
          <p>Tunisie</p>
          <p>Contactez-nous pour toute question.</p>
          <div className="footer-socials">
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook</a>
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 PARAÉLLE. Tous droits réservés.</p>
      </div>
    </footer>
  );
}

function Shop() {
  return <main className="container" style={{ padding: "60px 0" }}>
    <h1>Notre boutique</h1>
  </main>;
}


function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await loginUser(email, password);

      if (result.profile.role === "admin") {
        navigate("/admin");
      } else {
        setError("Ce compte ne possède pas les droits administrateur.");
      }
    } catch (err) {
      setError(err.message || "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ padding: "60px 0", maxWidth: "500px" }}>
      <h1>Connexion administrateur</h1>
      <p>Connectez-vous à votre espace PARAÉLLE.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px", marginTop: "25px" }}>
        <div className="form-group">
          <label>Adresse e-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre adresse e-mail"
            required
          />
        </div>

        <div className="form-group">
          <label>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            required
          />
        </div>

        {error && (
          <p style={{ color: "red" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="save-product-button"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </main>
  );
}

function AdminRoute() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const result = await isAdmin();

        if (active) {
          setAuthorized(result);
        }
      } catch {
        if (active) {
          setAuthorized(false);
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return <main className="container" style={{ padding: "60px 0" }}>
      Vérification des accès...
    </main>;
  }

  return authorized ? <Dashboard /> : <Navigate to="/login" replace />;
}


function Cart() {
  return <main className="container" style={{ padding: "60px 0" }}>
    <h1>Mon panier</h1>
  </main>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/shop" element={<Shop />} />
  <Route path="/login" element={<Login />} />
  <Route path="/cart" element={<Cart />} />

  {/* Administration */}
  <Route path="/admin" element={<AdminRoute />} />
</Routes>
    </BrowserRouter>
  );
}
