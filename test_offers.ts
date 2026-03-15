import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qovgxnnlxgqoswakubps.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_eo4ZIlW7QciJ7AOZ09rQdQ_M7KUYtyP";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTest() {
    const demandId = '47e860c4-f963-4275-b908-7d94eeef60d5';

    // Fetch demand items
    const { data: demandItems } = await supabase.from('demand_items').select('*').eq('demand_id', demandId);

    // Fetch offer items
    const { data: offers } = await supabase.from('offers').select('*, items:offer_items(*)').eq('demand_id', demandId);

    console.log('--- TEST LOGIC EXACTLY LIKE CONTEXT ---');

    for (const offer of offers || []) {
        for (const offerItem of offer.items || []) {
            const offerItemDescObj = offerItem.name?.trim().toLowerCase();
            const matchingDemandItem = demandItems?.find(di => di.name?.trim().toLowerCase() === offerItemDescObj);

            console.log(`Matching offer item: "${offerItem.name}" against demand items...`);
            if (matchingDemandItem) {
                console.log(`   MATCH FOUND! Demand ID ${matchingDemandItem.id} Has Qty ${matchingDemandItem.quantity}. Offer Qty is ${offerItem.quantity}`);
                if (matchingDemandItem.quantity !== offerItem.quantity) {
                    console.log('   >>> Quantity Difference Detected! Should trigger update.');
                } else {
                    console.log('   >>> Quantities are identical.');
                }
            } else {
                console.log(`   NO MATCH FOUND! String was: "${offerItemDescObj}"`);
                console.log('   Available Demand Item Strings:');
                demandItems?.forEach(di => console.log(`      - "${di.name?.trim().toLowerCase()}"`));
            }
        }
    }
}
runTest();
