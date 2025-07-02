#!/bin/bash

echo "🚀 Testing Fast Two-Phase Loading Performance"
echo "=============================================="

# Test original method (all data at once)
echo "📊 Testing original method (with signals)..."
original_start=$(date +%s%3N)
curl -s "http://localhost:8000/api/stocks/with-signals/all" > /dev/null
original_end=$(date +%s%3N)
original_time=$((original_end - original_start))

echo "   Time: ${original_time}ms"

# Test fast method (prices only)
echo ""
echo "⚡ Testing fast method (prices only)..."
fast_start=$(date +%s%3N)
curl -s "http://localhost:8000/api/stocks/fast/all" > /dev/null
fast_end=$(date +%s%3N)
fast_time=$((fast_end - fast_start))

echo "   Time: ${fast_time}ms"

# Test signals batch method
echo ""
echo "🔄 Testing signals batch method..."
batch_start=$(date +%s%3N)
curl -s "http://localhost:8000/api/stocks/signals/batch" > /dev/null
batch_end=$(date +%s%3N)
batch_time=$((batch_end - batch_start))

echo "   Time: ${batch_time}ms"

# Calculate improvements
echo ""
echo "📈 Performance Analysis:"
echo "========================"
echo "Original method:     ${original_time}ms"
echo "Fast method:         ${fast_time}ms"
echo "Batch method:        ${batch_time}ms"

if [ $fast_time -lt $original_time ]; then
    improvement=$(((original_time - fast_time) * 100 / original_time))
    echo "Fast method is ${improvement}% faster for initial display!"
fi

total_new=$((fast_time + batch_time))
echo ""
echo "Total time for two-phase approach: ${total_new}ms"
echo "But user sees data after just: ${fast_time}ms"

echo ""
echo "✅ User Experience Improvement:"
echo "   - Data visible: ${fast_time}ms (vs ${original_time}ms)"
echo "   - Signals loaded: +${batch_time}ms (background)"
echo "   - Total improvement: User sees data $(((original_time - fast_time) * 100 / original_time))% faster"
