const fs = require('fs');
const path = require('path');

async function testEndpoint() {
  const PORT = process.env.PORT || 3001;
  const url = `http://localhost:${PORT}/api/sketches`;

  console.log(`\n=== Starting API POST Verification (with Watermark) against ${url} ===\n`);

  // Test 1: Watermark Validation (Too long > 4 chars)
  console.log('Test 1: Sending watermark name too long ("HELLO")...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'a simple manga character',
        mangaStyle: 'SHONEN',
        drawingStyle: 'INKED_MANGA',
        watermarkText: 'HELLO',
        watermarkPosition: 'BOTTOM_RIGHT'
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, data);
    if (res.status === 400 && data.message.includes('too long')) {
      console.log('✅ Test 1 Passed: Correctly blocked long watermark.');
    } else {
      console.log('❌ Test 1 Failed.');
    }
  } catch (error) {
    console.error('❌ Test 1 Error:', error.message);
  }

  console.log('\n-----------------------------------------------\n');

  // Test 2: Watermark Validation (Invalid characters like "<script>")
  console.log('Test 2: Sending watermark containing bad characters ("NY<")...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'a simple manga character',
        mangaStyle: 'SHONEN',
        drawingStyle: 'INKED_MANGA',
        watermarkText: 'NY<',
        watermarkPosition: 'BOTTOM_RIGHT'
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, data);
    if (res.status === 400 && data.message.includes('only contain letters')) {
      console.log('✅ Test 2 Passed: Correctly blocked injection attempt.');
    } else {
      console.log('❌ Test 2 Failed.');
    }
  } catch (error) {
    console.error('❌ Test 2 Error:', error.message);
  }

  console.log('\n-----------------------------------------------\n');

  // Test 3: Successful Generation with Custom Watermark ("NY", BOTTOM_RIGHT)
  console.log('Test 3: Generating sketch with watermarkText="NY" and watermarkPosition="BOTTOM_RIGHT"...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'cyberpunk anime girl sitting on a neon motorcycle',
        mangaStyle: 'SEINEN',
        drawingStyle: 'INKED_MANGA',
        watermarkText: 'NY',
        watermarkPosition: 'BOTTOM_RIGHT',
        seed: 528656297 // Lock seed so we compare exactly with previous image
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    
    if (res.status === 200) {
      console.log('✅ Test 3 Passed: Successfully generated watermarked sketch.');
      console.log('- Watermark Text in Response:', data.watermarkText);
      console.log('- Watermark Position in Response:', data.watermarkPosition);
      
      if (data.imageUrl.startsWith('data:image/png;base64,')) {
        const base64Data = data.imageUrl.replace(/^data:image\/png;base64,/, "");
        const outPath = path.join(__dirname, 'api_output_watermarked.png');
        fs.writeFileSync(outPath, base64Data, 'base64');
        console.log(`- Saved generated image to scratch/api_output_watermarked.png`);
      }
    } else {
      console.log('❌ Test 3 Failed:', data);
    }
  } catch (error) {
    console.error('❌ Test 3 Error:', error.message);
  }

  console.log('\n-----------------------------------------------\n');

  // Test 4: Successful Generation with Empty Clean Watermark ("")
  console.log('Test 4: Generating sketch with watermarkText="" (No initials, clean stamp) and watermarkPosition="BOTTOM_LEFT"...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'cyberpunk anime girl sitting on a neon motorcycle',
        mangaStyle: 'SEINEN',
        drawingStyle: 'INKED_MANGA',
        watermarkText: '',
        watermarkPosition: 'BOTTOM_LEFT',
        seed: 528656297 // Lock seed
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    
    if (res.status === 200) {
      console.log('✅ Test 4 Passed: Successfully generated clean watermarked sketch.');
      console.log('- Watermark Text in Response:', JSON.stringify(data.watermarkText));
      console.log('- Watermark Position in Response:', data.watermarkPosition);
      
      if (data.imageUrl.startsWith('data:image/png;base64,')) {
        const base64Data = data.imageUrl.replace(/^data:image\/png;base64,/, "");
        const outPath = path.join(__dirname, 'api_output_clean_watermarked.png');
        fs.writeFileSync(outPath, base64Data, 'base64');
        console.log(`- Saved generated image to scratch/api_output_clean_watermarked.png`);
      }
    } else {
      console.log('❌ Test 4 Failed:', data);
    }
  } catch (error) {
    console.error('❌ Test 4 Error:', error.message);
  }

  console.log('\n=== API POST Verification Completed ===\n');
}

testEndpoint();
