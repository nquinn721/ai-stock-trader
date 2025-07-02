const axios = require('axios');

async function testStepByStep() {
  try {
    console.log('=== Testing Step-by-Step ===\n');

    // 1. Test basic stock data availability
    console.log('1. Testing stock data...');
    const stockResponse = await axios.get('http://localhost:8000/api/stocks/AAPL');
    console.log('✅ Stock data available:', stockResponse.data.symbol, stockResponse.data.currentPrice);

    // 2. Test ML service health
    console.log('\n2. Testing ML service health...');
    const mlHealthResponse = await axios.get('http://localhost:8000/api/ml/health');
    console.log('✅ ML service healthy:', mlHealthResponse.data.status);

    // 3. Test ML enhanced recommendation (the method our pipeline calls)
    console.log('\n3. Testing ML enhanced recommendation...');
    const mlRecResponse = await axios.post(
      'http://localhost:8000/api/ml/recommendation/enhanced/AAPL',
      {
        currentPrice: stockResponse.data.currentPrice,
        timeHorizon: '1D',
        ensembleOptions: {
          timeframes: ['1d'],
          ensembleMethod: 'voting',
          confidenceThreshold: 0.5
        }
      }
    );
    console.log('✅ ML enhanced recommendation works - Action:', mlRecResponse.data.action);

    // 4. Test pipeline config (should work)
    console.log('\n4. Testing pipeline config...');
    const configResponse = await axios.get('http://localhost:8000/api/recommendation-pipeline/config');
    console.log('✅ Pipeline config works:', configResponse.data.success);

    // 5. Test pipeline generation (this is failing)
    console.log('\n5. Testing pipeline generation...');
    try {
      const pipelineResponse = await axios.post(
        'http://localhost:8000/api/recommendation-pipeline/generate',
        { symbols: ['AAPL'] },
        { validateStatus: () => true }
      );
      
      if (pipelineResponse.status === 200) {
        console.log('✅ Pipeline generation works:', pipelineResponse.data);
      } else {
        console.log('❌ Pipeline generation failed:', pipelineResponse.status, pipelineResponse.data);
      }
    } catch (error) {
      console.log('❌ Pipeline generation error:', error.message);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testStepByStep();
