const axios = require('axios');
const cron = require('node-cron');

const BASE_URL = 'https://cd5ec6.myshopify.com/admin/api/2024-04'; // 'https://store.myshopify.com/admin/api/2024-04'
const headers = {
    'X-Shopify-Access-Token': process.env.ACCESS_TOKEN, // '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', // shpat_75643758239894902hsdfsdu7fy89w7re9
    'Content-Type': 'application/json'
};

// Function to introduce delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

exports.productData = async (req, res) => {
    try {
        console.log(`${BASE_URL}/products.json`, headers);

        // Step 1: Fetch all products
        const productsResponse = await axios.get(`${BASE_URL}/products.json`, { headers });
        const products = productsResponse.data.products;

        for (const product of products) {
            const productId = product.id;
            if (product.variants && product.variants.length > 0) {
                const variant = product.variants[0];
                const inventoryItemId = variant.inventory_item_id;
                const price = parseFloat(variant.price);

                // Introduce delay to prevent exceeding rate limit
                await delay(2000); // 500ms delay (2 calls per second)

                // Fetch the inventory item cost
                const inventoryResponse = await axios.get(`${BASE_URL}/inventory_items/${inventoryItemId}.json`, { headers });
                const cost = inventoryResponse.data.inventory_item.cost;

                if (cost != null) {
                    // Calculate the profit
                    const profit = (price - cost);

                    // Fetch existing metafields to find the correct metafield IDs
                    const metafieldsResponse = await axios.get(`${BASE_URL}/products/${productId}/metafields.json`, { headers });
                    const metafields = metafieldsResponse.data.metafields;

                    // Find the metafield IDs for the custom "cost" and "profit" metafields
                    const costMetafield = metafields.find(metafield => metafield.namespace === 'custom' && metafield.key === 'cost_per_item');
                    const profitMetafield = metafields.find(metafield => metafield.namespace === 'custom' && metafield.key === 'profit_of_product');

                    const costMetafieldData = {
                        metafield: {
                            namespace: "custom",
                            key: "cost_per_item",
                            value: cost.toString(), // Specify the type as single_line_text
                            type: "number_decimal"
                        }
                    };

                    const profitMetafieldData = {
                        metafield: {
                            namespace: "custom",
                            key: "profit_of_product",
                            value: profit.toFixed(2).toString(),
                            type: "number_decimal"
                        }
                    };

                    // Update or create the cost metafield
                    if (costMetafield) {
                        costMetafieldData.metafield.id = costMetafield.id;

                        await axios.put(`${BASE_URL}/products/${productId}/metafields/${costMetafield.id}.json`, costMetafieldData, { headers })
                            .then(response => {
                                console.log(`Cost metafield updated for product ID: ${productId} with cost: ${cost}`, costMetafieldData);
                            })
                            .catch(error => {
                                console.error(`Error updating cost metafield for product ID: ${productId}`, error.response ? error.response.data : error.message);
                            });
                    } else {
                        await axios.post(`${BASE_URL}/products/${productId}/metafields.json`, costMetafieldData, { headers })
                            .then(response => {
                                console.log(`Cost metafield created for product ID: ${productId} with cost: ${cost}`, costMetafieldData);
                            })
                            .catch(error => {
                                console.error(`Error creating cost metafield for product ID: ${productId}`, error.response ? error.response.data : error.message);
                            });
                    }

                    // Update or create the profit metafield
                    if (profitMetafield) {
                        profitMetafieldData.metafield.id = profitMetafield.id;

                        await axios.put(`${BASE_URL}/products/${productId}/metafields/${profitMetafield.id}.json`, profitMetafieldData, { headers })
                            .then(response => {
                                console.log(`Profit metafield updated for product ID: ${productId} with profit: ${profit.toFixed(2)}`, profitMetafieldData);
                            })
                            .catch(error => {
                                console.error(`Error updating profit metafield for product ID: ${productId}`, error.response ? error.response.data : error.message);
                            });
                    } else {
                        await axios.post(`${BASE_URL}/products/${productId}/metafields.json`, profitMetafieldData, { headers })
                            .then(response => {
                                console.log(`Profit metafield created for product ID: ${productId} with profit: ${profit.toFixed(2)}`, profitMetafieldData);
                            })
                            .catch(error => {
                                console.error(`Error creating profit metafield for product ID: ${productId}`, error.response ? error.response.data : error.message);
                            });
                    }
                }
            }
        }

        res.status(200).send('All product metafields updated successfully.');
    } catch (error) { 
        console.error('Error updating metafields:', error);
        res.status(500).send('An error occurred while updating product metafields.');
    }
};

exports.testData = async (req, res) => {
    res.status(200).send('Your API works properly!!!');
};
