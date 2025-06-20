import React, { useState } from "react";
import { NewsArticle, SentimentData } from "../types";
import "./SentimentDisplay.css";

interface SentimentDisplayProps {
  sentiment: SentimentData;
  recentNews?: NewsArticle[];
  symbol: string;
}

const SentimentDisplay: React.FC<SentimentDisplayProps> = ({
  sentiment,
  recentNews = [],
  symbol,
}) => {
  const [showNews, setShowNews] = useState(false);

  const getSentimentColor = (label: string) => {
    switch (label) {
      case "very_positive":
        return "#00C851";
      case "positive":
        return "#4CAF50";
      case "neutral":
        return "#ffbb33";
      case "negative":
        return "#ff4444";
      case "very_negative":
        return "#d32f2f";
      default:
        return "#666";
    }
  };

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case "very_positive":
        return "🚀";
      case "positive":
        return "📈";
      case "neutral":
        return "➖";
      case "negative":
        return "📉";
      case "very_negative":
        return "⚠️";
      default:
        return "❓";
    }
  };

  const formatSentimentLabel = (label: string) => {
    return label.replace("_", " ").toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="sentiment-display">
      <div className="sentiment-header">
        <div className="sentiment-main">
          <span className="sentiment-icon">
            {getSentimentIcon(sentiment.label)}
          </span>
          <div className="sentiment-info">
            <div
              className="sentiment-label"
              style={{ color: getSentimentColor(sentiment.label) }}
            >
              {formatSentimentLabel(sentiment.label)}
            </div>
            <div className="sentiment-score">
              Score: {(sentiment.score * 100).toFixed(1)} | Confidence:{" "}
              {(sentiment.confidence * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {recentNews.length > 0 && (
          <button
            className="news-toggle"
            onClick={() => setShowNews(!showNews)}
          >
            {showNews ? "Hide" : "Show"} News ({recentNews.length})
          </button>
        )}
      </div>

      {sentiment.articlesAnalyzed > 0 && (
        <div className="articles-analyzed">
          Based on {sentiment.articlesAnalyzed} recent articles
          {sentiment.lastUpdated && (
            <span className="last-updated">
              • Updated {formatDate(sentiment.lastUpdated)}
            </span>
          )}
        </div>
      )}

      {showNews && recentNews.length > 0 && (
        <div className="news-section">
          <div className="news-header">Recent News Analysis</div>
          <div className="news-list">
            {recentNews.map((article, index) => (
              <div key={index} className="news-item">
                <div className="news-title">{article.title}</div>
                <div className="news-meta">
                  <span className="news-source">{article.source}</span>
                  <span className="news-date">
                    {formatDate(article.publishedAt)}
                  </span>
                  <span
                    className="news-sentiment"
                    style={{ color: getSentimentColor(article.sentiment) }}
                  >
                    {formatSentimentLabel(article.sentiment)} (
                    {(article.score * 100).toFixed(1)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SentimentDisplay;
