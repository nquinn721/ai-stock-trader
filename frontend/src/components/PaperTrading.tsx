import React, { useState } from "react";
import Portfolio from "./Portfolio";
import PortfolioList from "./PortfolioList";

const PaperTrading: React.FC = () => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(
    null
  );

  const handleSelectPortfolio = (portfolioId: number) => {
    setSelectedPortfolioId(portfolioId);
  };

  const handleBackToList = () => {
    setSelectedPortfolioId(null);
  };

  return (
    <div>
      {selectedPortfolioId ? (
        <Portfolio
          portfolioId={selectedPortfolioId}
          onBack={handleBackToList}
        />
      ) : (
        <PortfolioList onSelectPortfolio={handleSelectPortfolio} />
      )}
    </div>
  );
};

export default PaperTrading;
