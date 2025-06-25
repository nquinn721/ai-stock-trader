import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { usePortfolioStore } from "../stores/StoreContext";
import { CreatePortfolioRequest, Portfolio } from "../types";
import "./PortfolioList.css";

interface PortfolioListProps {
  onSelectPortfolio: (portfolioId: number) => void;
}

const PortfolioList: React.FC<PortfolioListProps> = observer(
  ({ onSelectPortfolio }) => {
    const portfolioStore = usePortfolioStore();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createForm, setCreateForm] = useState({
      name: "",
      initialCash: "100000",
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
      portfolioStore.fetchPortfolios();
    }, [portfolioStore]);

    const createPortfolio = async () => {
      try {
        setCreating(true);
        const portfolioData: CreatePortfolioRequest = {
          name: createForm.name,
          initialCash: parseFloat(createForm.initialCash),
        };

        await portfolioStore.createPortfolio({
          name: portfolioData.name,
          initialCash: portfolioData.initialCash || 100000,
        });

        // Reset form and refresh portfolios
        setCreateForm({ name: "", initialCash: "100000" });
        setShowCreateForm(false);
      } catch (error: any) {
        console.error("Error creating portfolio:", error);
        window.alert(
          error.response?.data?.message || "Error creating portfolio"
        );
      } finally {
        setCreating(false);
      }
    };
    const deletePortfolio = async (portfolioId: number) => {
      if (
        !window.confirm(
          "Are you sure you want to delete this portfolio? This action cannot be undone."
        )
      ) {
        return;
      }

      try {
        await portfolioStore.deletePortfolio(portfolioId);
        await portfolioStore.fetchPortfolios();
      } catch (error: any) {
        console.error("Error deleting portfolio:", error);
        window.alert(
          error.response?.data?.message || "Error deleting portfolio"
        );
      }
    };
    const formatCurrency = (amount: number | string | null | undefined) => {
      const numValue = Number(amount) || 0;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numValue);
    };
    const formatPercent = (percent: number | string | null | undefined) => {
      const numValue = Number(percent) || 0;
      return `${numValue >= 0 ? "+" : ""}${numValue.toFixed(2)}%`;
    };

    if (portfolioStore.isLoading) {
      return (
        <div className="portfolio-list-loading">
          <div className="loading-spinner"></div>
          <p>Loading portfolios...</p>
        </div>
      );
    }

    return (
      <div className="portfolio-list-container">
        <div className="portfolio-list-header">
          <h1>Paper Trading Portfolios</h1>
          <button
            className="create-portfolio-button"
            onClick={() => setShowCreateForm(true)}
          >
            Create New Portfolio
          </button>
        </div>

        {portfolioStore.portfolios.length > 0 ? (
          <div className="portfolios-grid">
            {portfolioStore.portfolios.map((portfolio: Portfolio) => (
              <div key={portfolio.id} className="portfolio-card">
                <div className="portfolio-card-header">
                  <h3>{portfolio.name}</h3>
                  <button
                    className="delete-button"
                    onClick={() => deletePortfolio(portfolio.id)}
                    title="Delete Portfolio"
                  >
                    ×
                  </button>
                </div>

                <div className="portfolio-stats">
                  <div className="stat">
                    <span className="stat-label">Total Value</span>
                    <span className="stat-value">
                      {formatCurrency(portfolio.totalValue)}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Cash</span>
                    <span className="stat-value">
                      {formatCurrency(portfolio.currentCash)}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">P&L</span>
                    <span
                      className={`stat-value ${
                        portfolio.totalPnL >= 0 ? "positive" : "negative"
                      }`}
                    >
                      {formatCurrency(portfolio.totalPnL)}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Return</span>
                    <span
                      className={`stat-value ${
                        portfolio.totalReturn >= 0 ? "positive" : "negative"
                      }`}
                    >
                      {formatPercent(portfolio.totalReturn)}
                    </span>
                  </div>
                </div>

                <div className="portfolio-meta">
                  <span className="positions-count">
                    {portfolio.positions?.length || 0} positions
                  </span>
                  <span className="trades-count">
                    {portfolio.trades?.length || 0} trades
                  </span>
                </div>

                <button
                  className="open-portfolio-button"
                  onClick={() => onSelectPortfolio(portfolio.id)}
                >
                  Open Portfolio
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-portfolios">
            <h2>No Portfolios Yet</h2>
            <p>
              Create your first paper trading portfolio to start practicing your
              trading strategies risk-free!
            </p>
            <button
              className="create-first-portfolio-button"
              onClick={() => setShowCreateForm(true)}
            >
              Create Your First Portfolio
            </button>
          </div>
        )}

        {showCreateForm && (
          <div className="create-portfolio-modal">
            <div className="create-portfolio-modal-content">
              <div className="create-portfolio-modal-header">
                <h2>Create New Portfolio</h2>
                <button
                  className="close-button"
                  onClick={() => setShowCreateForm(false)}
                >
                  ×
                </button>
              </div>
              <div className="create-portfolio-form">
                <div className="form-group">
                  <label>Portfolio Name:</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    placeholder="e.g., My Trading Portfolio"
                  />
                </div>
                <div className="form-group">
                  <label>Initial Cash:</label>
                  <input
                    type="number"
                    value={createForm.initialCash}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        initialCash: e.target.value,
                      })
                    }
                    min="1000"
                    step="1000"
                    placeholder="100000"
                  />
                  <span className="form-help">
                    Starting amount for your paper trading portfolio
                  </span>
                </div>
                <div className="form-actions">
                  <button
                    className="cancel-button"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="create-button"
                    onClick={createPortfolio}
                    disabled={
                      creating || !createForm.name || !createForm.initialCash
                    }
                  >
                    {creating ? "Creating..." : "Create Portfolio"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default PortfolioList;
