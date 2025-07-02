#!/bin/bash

echo "🎯 Fast Loading User Experience Demo"
echo "===================================="

echo ""
echo "🔄 Simulating user loading experience..."
echo ""

echo "👤 User opens trading dashboard..."
echo "⏱️  Measuring time to see stock prices..."

start_time=$(date +%s%3N)

# Fast phase - user sees stock prices immediately
curl -s "http://localhost:8000/api/stocks/fast/all" > /tmp/fast_stocks.json
prices_loaded_time=$(date +%s%3N)

prices_time=$((prices_loaded_time - start_time))
stock_count=$(grep -o '"symbol"' /tmp/fast_stocks.json | wc -l)

echo "✅ Phase 1 Complete: User sees ${stock_count} stocks with live prices"
echo "   Time: ${prices_time}ms"
echo ""
echo "💡 User can now:"
echo "   - View live market prices"
echo "   - See which stocks are up/down"
echo "   - Start analyzing opportunities"
echo "   - Make quick trading decisions"
echo ""

echo "🔄 Meanwhile, signals are calculating in background..."

# Signals phase - happens in background
curl -s "http://localhost:8000/api/stocks/signals/batch" > /tmp/signals.json
signals_loaded_time=$(date +%s%3N)

signals_time=$((signals_loaded_time - prices_loaded_time))
total_time=$((signals_loaded_time - start_time))

signal_count=$(grep -o '"signal":{' /tmp/signals.json | wc -l)

echo "✅ Phase 2 Complete: ${signal_count} trading signals calculated"
echo "   Additional time: ${signals_time}ms"
echo "   Total time: ${total_time}ms"
echo ""

echo "📊 User Experience Summary:"
echo "=========================="
echo "Time to see data:        ${prices_time}ms (immediate value)"
echo "Time for full features:  +${signals_time}ms (background)"
echo "Total stocks available:  ${stock_count}"
echo "Trading signals ready:   ${signal_count}"
echo ""

echo "🎉 Result: Users get immediate market access and can start trading"
echo "    while advanced features load seamlessly in the background!"

# Cleanup
rm -f /tmp/fast_stocks.json /tmp/signals.json
