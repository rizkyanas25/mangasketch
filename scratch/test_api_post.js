const fs = require('fs');
const path = require('path');

async function testEndpoint() {
  const PORT = process.env.PORT || 3001;
  const url = `http://localhost:${PORT}/api/sketches`;

  console.log(`\n=== Starting API POST Verification against ${url} ===\n`);

  // Test 1: Empty Prompt Validation
  console.log('Test 1: Sending empty prompt...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: '',
        mangaStyle: 'SHONEN',
        drawingStyle: 'INKED_MANGA'
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, data);
    if (res.status === 400 && data.code === 'INVALID_PROMPT') {
      console.log('✅ Test 1 Passed: Correctly blocked empty prompt.');
    } else {
      console.log('❌ Test 1 Failed.');
    }
  } catch (error) {
    console.error('❌ Test 1 Error:', error.message);
  }

  console.log('\n-----------------------------------------------\n');

  // Test 2: Safety Filter Blocklist Validation
  console.log('Test 2: Sending prompt containing blocked word ("nsfw")...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'a nsfw sketch of a ninja',
        mangaStyle: 'SHONEN',
        drawingStyle: 'INKED_MANGA'
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, data);
    if (res.status === 400 && data.code === 'PROHIBITED_PROMPT') {
      console.log('✅ Test 2 Passed: Correctly caught blocked word.');
    } else {
      console.log('❌ Test 2 Failed.');
    }
  } catch (error) {
    console.error('❌ Test 2 Error:', error.message);
  }

  console.log('\n-----------------------------------------------\n');

  // Test 3: Successful Generation (Anonymous)
  console.log('Test 3: Sending valid prompt (Anonymous request)...');
  const startTime = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'cyberpunk samurai warrior standing in the rain',
        mangaStyle: 'SEINEN',
        drawingStyle: 'INKED_MANGA'
      })
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const data = await res.json();
    console.log(`Status: ${res.status} (took ${duration}s)`);
    
    if (res.status === 200) {
      console.log('✅ Test 3 Passed: Successfully generated sketch.');
      console.log('- Saved Status:', data.saved);
      console.log('- Seed Used:', data.seed);
      console.log('- Image URL prefix:', data.imageUrl.substring(0, 50) + '...');
      
      // Save the generated base64 image to verify it physically
      if (data.imageUrl.startsWith('data:image/png;base64,')) {
        const base64Data = data.imageUrl.replace(/^data:image\/png;base64,/, "");
        const outPath = path.join(__dirname, 'api_output_anon.png');
        fs.writeFileSync(outPath, base64Data, 'base64');
        console.log(`- Saved generated image to scratch/api_output_anon.png`);
      }
    } else {
      console.log('❌ Test 3 Failed:', data);
    }
  } catch (error) {
    console.error('❌ Test 3 Error:', error.message);
  }

  console.log('\n=== API POST Verification Completed ===\n');
}

testEndpoint();
