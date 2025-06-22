// Mock for @xenova/transformers to avoid ES modules issues in Jest
module.exports = {
  pipeline: jest.fn(() => 
    Promise.resolve({
      predict: jest.fn(() => ({
        confidence: 0.75,
        prediction: 'HOLD',
        reasoning: 'Mock ML prediction'
      }))
    })
  ),
  env: {
    backends: {}
  }
};
