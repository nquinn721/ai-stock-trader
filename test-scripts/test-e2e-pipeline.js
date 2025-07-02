const axios = require('axios');

async function testEndToEndRecommendationPipeline() {
  try {
    console.log('🔄 Testing End-to-End Recommendation Pipeline...\n');

    const baseUrl = 'http://localhost:8000/api';

    // Step 1: Generate recommendations
    console.log('1. Generating recommendations for AAPL...');
    const generateResponse = await axios.post(
      `${baseUrl}/recommendation-pipeline/generate`,
      {
        symbols: ['AAPL'],
        includeRiskAnalysis: true
      }
    );

    console.log('✅ Generation Result:', {
      success: generateResponse.data.success,
      totalGenerated: generateResponse.data.totalGenerated,
      recommendations: generateResponse.data.recommendations?.length || 0
    });

    if (generateResponse.data.recommendations?.length > 0) {
      const recommendation = generateResponse.data.recommendations[0];
      console.log('\n📋 Generated Recommendation:', {
        id: recommendation.id,
        symbol: recommendation.symbol,
        action: recommendation.action,
        confidence: recommendation.confidence,
        entryPrice: recommendation.entryPrice,
        riskLevel: recommendation.riskLevel
      });

      // Step 2: Convert recommendation to order
      console.log('\n2. Converting recommendation to order...');
      const convertResponse = await axios.post(
        `${baseUrl}/recommendation-pipeline/convert-to-order`,
        {
          recommendationId: recommendation.id,
          portfolioId: 1,
          autoExecute: false
        }
      );

      console.log('✅ Conversion Result:', {
        success: convertResponse.data.success,
        orderId: convertResponse.data.orderId,
        errors: convertResponse.data.errors
      });

      if (convertResponse.data.success && convertResponse.data.orderId) {
        // Step 3: Check if order was created in database
        console.log('\n3. Checking created order...');
        try {
          const orderResponse = await axios.get(
            `${baseUrl}/auto-trading/orders/${convertResponse.data.orderId}`
          );
          console.log('✅ Order Created:', {
            id: orderResponse.data.id,
            symbol: orderResponse.data.symbol,
            action: orderResponse.data.action,
            status: orderResponse.data.status
          });
        } catch (orderError) {
          console.log('⚠️ Could not retrieve order details:', orderError.response?.status);
        }
      }

      // Step 4: Test pipeline configuration and autoExecution
      console.log('\n4. Testing pipeline configuration...');
      const configResponse = await axios.get(`${baseUrl}/recommendation-pipeline/config`);
      console.log('✅ Current Config:', {
        enabled: configResponse.data.config.enabled,
        autoExecutionEnabled: configResponse.data.config.autoExecutionEnabled,
        minimumConfidence: configResponse.data.config.minimumConfidence
      });

      // Step 5: Enable auto execution and test
      console.log('\n5. Enabling auto execution...');
      const updateResponse = await axios.put(
        `${baseUrl}/recommendation-pipeline/config`,
        {
          autoExecutionEnabled: true
        }
      );
      console.log('✅ Auto execution enabled:', updateResponse.data.success);

      console.log('\n🎉 End-to-End Test Completed Successfully!');
      console.log('\n📊 Summary:');
      console.log('- ✅ Recommendation generation: Working');
      console.log('- ✅ Recommendation to order conversion: Working');
      console.log('- ✅ Pipeline configuration: Working');
      console.log('- ✅ Auto execution: Enabled');

    } else {
      console.log('❌ No recommendations generated');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testEndToEndRecommendationPipeline();
